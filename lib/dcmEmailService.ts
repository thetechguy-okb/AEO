import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export const DCM_SECTOR_LABELS: Record<string, string> = {
  media: 'Media',
  cso: 'Civil society organisation',
  research: 'Academic or research institution',
  partner: 'Development partner or diplomatic mission',
  private: 'Private sector',
  party: 'Political party, candidate or campaign',
  government: 'Government or public institution',
  individual: 'Individual or other'
};

export type EmailProviderType = 'microsoft-graph' | 'resend' | 'smtp';

export interface EmailConfigurationStatus {
  configured: boolean;
  provider: EmailProviderType | null;
  transports: {
    microsoftGraph: boolean;
    resend: boolean;
    smtp: boolean;
  };
  missingVars: string[];
}

export interface DcmBriefProcessResult {
  statusCode: number;
  payload: Record<string, any>;
}

const DCM_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DCM_RATE_LIMIT_MAX = 5;
const DCM_DUPLICATE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

// NOTE: Process-local maps provide best-effort protection within a warm Node/serverless instance only.
// Cross-instance serverless protection requires Vercel WAF / Firewall rate limiting or a shared store (e.g. Upstash Redis / Vercel KV).
const dcmIpRequestLog = new Map<string, number[]>();
const dcmRecentSubmissions = new Map<string, number>();
const dcmInFlightSubmissions = new Set<string>();

export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function safeFetchJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => '');
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

export function getEmailConfigurationStatus(): EmailConfigurationStatus {
  const msTenantId = process.env.MS_TENANT_ID?.trim();
  const msClientId = process.env.MS_CLIENT_ID?.trim();
  const msClientSecret = process.env.MS_CLIENT_SECRET?.trim();
  const msGraphSender = (process.env.MS_GRAPH_SENDER || 'aeo@athenacentre.org').trim();
  const senderPattern = /^[^\s@/?#]+@[^\s@/?#]+\.[^\s@/?#]{2,}$/;

  const msGraphConfigured = Boolean(
    msTenantId && msClientId && msClientSecret && msGraphSender && senderPattern.test(msGraphSender)
  );

  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);

  // Prefer Microsoft Graph when explicitly configured
  let provider: EmailProviderType | null = null;
  if (msGraphConfigured) {
    provider = 'microsoft-graph';
  } else if (resendConfigured) {
    provider = 'resend';
  } else if (smtpConfigured) {
    provider = 'smtp';
  }

  const missingVars: string[] = [];
  if (!msGraphConfigured) {
    if (!msTenantId) missingVars.push('MS_TENANT_ID');
    if (!msClientId) missingVars.push('MS_CLIENT_ID');
    if (!msClientSecret) missingVars.push('MS_CLIENT_SECRET');
    if (!msGraphSender || !senderPattern.test(msGraphSender)) missingVars.push('MS_GRAPH_SENDER');
  }

  return {
    configured: provider !== null,
    provider,
    transports: {
      microsoftGraph: msGraphConfigured,
      resend: resendConfigured,
      smtp: smtpConfigured
    },
    missingVars
  };
}

export function getHealthPayload(configLoadedOverride?: boolean): Record<string, any> {
  const emailConfigStatus = getEmailConfigurationStatus();
  let configLoaded = configLoadedOverride;
  if (typeof configLoaded !== 'boolean') {
    const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
    try {
      if (fs.existsSync(firebaseConfigPath)) {
        const parsed = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
        configLoaded = !!parsed?.apiKey;
      } else {
        configLoaded = false;
      }
    } catch {
      configLoaded = false;
    }
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    configLoaded,
    emailConfigured: emailConfigStatus.configured,
    emailProvider: emailConfigStatus.provider,
    emailTransports: emailConfigStatus.transports
  };
}

class EmailDeliveryHttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, publicMessage: string) {
    super(publicMessage);
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function sendEmailViaMicrosoftGraph(params: {
  recipientEmail: string;
  replyToEmail: string;
  replyToName: string;
  subject: string;
  htmlBody: string;
}): Promise<{ acceptedStatus: number; requestId: string }> {
  const tenantId = process.env.MS_TENANT_ID!.trim();
  const clientId = process.env.MS_CLIENT_ID!.trim();
  const clientSecret = process.env.MS_CLIENT_SECRET!.trim();
  const senderAddress = (process.env.MS_GRAPH_SENDER || 'aeo@athenacentre.org').trim();

  // 1. Authenticate with Microsoft Entra ID using OAuth 2.0 client credentials flow
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const tokenForm = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: tokenForm.toString(),
    signal: AbortSignal.timeout(15000)
  });

  const tokenData = await safeFetchJson(tokenRes);
  if (!tokenRes.ok || !tokenData?.access_token) {
    const aadError = typeof tokenData?.error === 'string' ? tokenData.error : 'token_request_failed';
    const aadCodes = Array.isArray(tokenData?.error_codes) ? tokenData.error_codes.join(',') : 'unknown';
    console.error(
      `[DCM Brief Request] Microsoft Entra authentication failed (HTTP ${tokenRes.status}, error=${aadError}, codes=${aadCodes})`
    );
    throw new EmailDeliveryHttpError(
      502,
      'MS_ENTRA_AUTH_FAILED',
      'Email service authentication with Microsoft 365 failed. Please verify application credentials configuration.'
    );
  }

  const accessToken = String(tokenData.access_token);

  // 2. Send email via Microsoft Graph /users/{sender}/sendMail
  const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${senderAddress}/sendMail`;
  const graphRes = await fetch(sendMailUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        subject: params.subject,
        body: {
          contentType: 'HTML',
          content: params.htmlBody
        },
        toRecipients: [
          {
            emailAddress: {
              address: params.recipientEmail
            }
          }
        ],
        replyTo: [
          {
            emailAddress: {
              address: params.replyToEmail,
              name: params.replyToName
            }
          }
        ]
      },
      saveToSentItems: true
    }),
    signal: AbortSignal.timeout(15000)
  });

  // Microsoft Graph returns 202 Accepted when message is accepted for processing
  if (graphRes.status === 202 || graphRes.ok) {
    const requestId = graphRes.headers.get('request-id') || '';
    return {
      acceptedStatus: graphRes.status,
      requestId
    };
  }

  const graphErrData = await safeFetchJson(graphRes);
  const graphErrCode = typeof graphErrData?.error?.code === 'string' ? graphErrData.error.code : 'GraphApiError';
  console.error(
    `[DCM Brief Request] Microsoft Graph sendMail failed (HTTP ${graphRes.status}, code=${graphErrCode})`
  );

  if (graphRes.status === 401) {
    throw new EmailDeliveryHttpError(
      502,
      'MS_GRAPH_UNAUTHORIZED',
      'Email service authorization token was rejected by Microsoft Graph. Please try again later.'
    );
  }

  if (
    graphRes.status === 403 ||
    graphErrCode === 'ErrorAccessDenied' ||
    graphErrCode === 'ErrorSendAsDenied' ||
    graphErrCode === 'Authorization_RequestDenied'
  ) {
    throw new EmailDeliveryHttpError(
      502,
      'MS_GRAPH_PERMISSION_DENIED',
      'Email service does not have permission to send from the authorised mailbox. Please contact the site administrator.'
    );
  }

  if (graphRes.status === 404 || graphErrCode === 'ErrorInvalidUser' || graphErrCode === 'ResourceNotFound') {
    throw new EmailDeliveryHttpError(
      502,
      'MS_GRAPH_MAILBOX_NOT_FOUND',
      'The configured Microsoft 365 sender mailbox could not be found.'
    );
  }

  if (graphRes.status === 429) {
    throw new EmailDeliveryHttpError(
      503,
      'MS_GRAPH_THROTTLED',
      'Email delivery service is temporarily busy. Please try again in a few moments.'
    );
  }

  throw new EmailDeliveryHttpError(
    502,
    'MS_GRAPH_SEND_FAILED',
    'We were unable to deliver your request through Microsoft 365 right now. Please try again later.'
  );
}

export async function processDcmBriefRequest(input: {
  body: any;
  clientIp: string;
}): Promise<DcmBriefProcessResult> {
  const body = input.body && typeof input.body === 'object' ? input.body : {};

  // 1. Spam / Honeypot protection
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: 'Request could not be processed.'
      }
    };
  }

  // 2. Best-effort process-local per-IP sliding-window rate limiting
  const clientIp = input.clientIp || 'unknown';
  const now = Date.now();
  const recentTimestamps = (dcmIpRequestLog.get(clientIp) || []).filter(
    (ts) => now - ts < DCM_RATE_LIMIT_WINDOW_MS
  );
  if (recentTimestamps.length >= DCM_RATE_LIMIT_MAX) {
    return {
      statusCode: 429,
      payload: {
        success: false,
        error: 'Too many requests submitted from your connection. Please wait a few minutes and try again.'
      }
    };
  }
  recentTimestamps.push(now);
  dcmIpRequestLog.set(clientIp, recentTimestamps);

  // Clean up expired duplicate cache entries periodically
  for (const [k, ts] of dcmRecentSubmissions.entries()) {
    if (now - ts >= DCM_DUPLICATE_WINDOW_MS) {
      dcmRecentSubmissions.delete(k);
    }
  }

  // 3. Strict Server-Side Validation
  const rawName = typeof body.fullName === 'string' ? body.fullName : '';
  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const rawOrg = typeof body.organisation === 'string' ? body.organisation : '';
  const rawSector = typeof body.sector === 'string' ? body.sector : '';
  const rawIntendedUse = typeof body.intendedUse === 'string' ? body.intendedUse : '';
  const consent = body.consent === true;
  const rawPublicationTitle = typeof body.publicationTitle === 'string' ? body.publicationTitle : '';
  const rawReportingPeriod = typeof body.reportingPeriod === 'string' ? body.reportingPeriod : '';
  const rawSelectedState = typeof body.selectedState === 'string' ? body.selectedState : '';

  const cleanName = sanitizeHeaderValue(rawName);
  const cleanEmail = sanitizeHeaderValue(rawEmail).toLowerCase();
  const cleanOrg = rawOrg.trim().slice(0, 200);
  const cleanSectorKey = rawSector.trim();
  const cleanIntendedUse = rawIntendedUse.trim().slice(0, 2000);
  const cleanPublicationTitle = sanitizeHeaderValue(rawPublicationTitle || 'Democratic Competitiveness Map (DCM)').slice(0, 200);
  const cleanReportingPeriod = sanitizeHeaderValue(rawReportingPeriod).slice(0, 120);
  const cleanSelectedState = sanitizeHeaderValue(rawSelectedState || 'All States').slice(0, 80);

  if (cleanName.length < 2 || cleanName.length > 120) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: 'Please enter a valid full name (between 2 and 120 characters).'
      }
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!cleanEmail || cleanEmail.length > 254 || !emailPattern.test(cleanEmail)) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: 'Please enter a valid email address.'
      }
    };
  }

  const categoryLabel =
    DCM_SECTOR_LABELS[cleanSectorKey] ||
    (Object.values(DCM_SECTOR_LABELS).includes(cleanSectorKey) ? cleanSectorKey : '');
  if (!categoryLabel) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: 'Please select a valid respondent category.'
      }
    };
  }

  if (!consent) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: 'Privacy consent is required to submit a brief request.'
      }
    };
  }

  if (!cleanReportingPeriod) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: 'Reporting period information is missing. Please reload the page and try again.'
      }
    };
  }

  // 4. Best-effort process-local duplicate submission protection
  const dedupKey = `${cleanEmail}|${cleanReportingPeriod.toLowerCase()}|${cleanSelectedState.toLowerCase()}`;
  if (dcmInFlightSubmissions.has(dedupKey)) {
    return {
      statusCode: 409,
      payload: {
        success: false,
        error: 'Your request is currently being processed. Please wait a moment.'
      }
    };
  }
  const previousSubmissionTime = dcmRecentSubmissions.get(dedupKey);
  if (previousSubmissionTime && now - previousSubmissionTime < DCM_DUPLICATE_WINDOW_MS) {
    return {
      statusCode: 409,
      payload: {
        success: false,
        error: 'A DCM Brief request for this publication period has already been submitted with this email address.'
      }
    };
  }

  // 5. Verify Email Service Credentials
  const emailStatus = getEmailConfigurationStatus();
  if (!emailStatus.configured || !emailStatus.provider) {
    console.warn(
      '[DCM Brief Request] Email service not configured. Missing:',
      emailStatus.missingVars.join(', '),
      'or RESEND_API_KEY / SMTP_*'
    );
    return {
      statusCode: 503,
      payload: {
        success: false,
        code: 'EMAIL_SERVICE_NOT_CONFIGURED',
        error:
          'Email delivery is not configured on the server yet. Missing Microsoft Graph credentials (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_GRAPH_SENDER), RESEND_API_KEY, or SMTP credentials.'
      }
    };
  }

  // 6. Compose Email Content
  const recipientEmail = (process.env.DCM_BRIEF_RECIPIENT || 'aeo@athenacentre.org').trim();
  const submissionTimestamp = new Date().toISOString();
  const emailSubject = `DCM Brief Request | ${cleanReportingPeriod} | ${cleanName}`;

  const textBody = [
    'New DCM Brief Request',
    '',
    `Full Name: ${cleanName}`,
    `Email Address: ${cleanEmail}`,
    `Organisation: ${cleanOrg || 'Not provided'}`,
    `Respondent Category: ${categoryLabel}`,
    `Intended Use: ${cleanIntendedUse || 'Not provided'}`,
    `Requested Publication: ${cleanPublicationTitle}`,
    `Reporting Period: ${cleanReportingPeriod}`,
    `Selected State: ${cleanSelectedState}`,
    `Submission Date: ${submissionTimestamp}`,
    'Source: AEO Democratic Competitiveness Map'
  ].join('\n');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1c232b; max-width: 640px; line-height: 1.5;">
      <h2 style="margin: 0 0 16px; color: #0f172a;">New DCM Brief Request</h2>
      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tbody>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; width: 200px;">Full Name</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(cleanName)}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Email Address</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Organisation</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(cleanOrg || 'Not provided')}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Respondent Category</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(categoryLabel)}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Intended Use</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(cleanIntendedUse || 'Not provided')}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Requested Publication</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(cleanPublicationTitle)}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Reporting Period</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(cleanReportingPeriod)}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Selected State</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(cleanSelectedState)}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Submission Date</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${escapeHtml(submissionTimestamp)}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Source</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">AEO Democratic Competitiveness Map</td></tr>
        </tbody>
      </table>
    </div>
  `.trim();

  // 7. Send via Authenticated Provider (prefer Microsoft Graph when configured)
  dcmInFlightSubmissions.add(dedupKey);
  try {
    if (emailStatus.provider === 'microsoft-graph') {
      const graphResult = await sendEmailViaMicrosoftGraph({
        recipientEmail,
        replyToEmail: cleanEmail,
        replyToName: cleanName,
        subject: emailSubject,
        htmlBody
      });

      dcmRecentSubmissions.set(dedupKey, Date.now());
      return {
        statusCode: 202,
        payload: {
          success: true,
          provider: 'microsoft-graph',
          deliveryStatus: 'accepted',
          providerHttpStatus: graphResult.acceptedStatus,
          requestId: graphResult.requestId || undefined,
          message: 'Thank you. Your DCM Brief request has been received. The AEO team will contact you using the email address provided.'
        }
      };
    }

    let providerMessageId = '';

    if (emailStatus.provider === 'resend') {
      const resendApiKey = process.env.RESEND_API_KEY!.trim();
      const fromAddress = (process.env.EMAIL_FROM || 'Athena Election Observatory <onboarding@resend.dev>').trim();

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipientEmail],
          reply_to: cleanEmail,
          subject: emailSubject,
          text: textBody,
          html: htmlBody
        }),
        signal: AbortSignal.timeout(15000)
      });

      const resendData = await safeFetchJson(resendRes);
      if (!resendRes.ok) {
        console.error('[DCM Brief Request] Resend delivery failed:', resendRes.status);
        return {
          statusCode: 502,
          payload: {
            success: false,
            error: 'We were unable to deliver your request right now. Please try again later.'
          }
        };
      }
      providerMessageId = resendData?.id || '';
    } else {
      const smtpHost = process.env.SMTP_HOST!.trim();
      const smtpPort = Number(process.env.SMTP_PORT || '587');
      const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
      const smtpUser = process.env.SMTP_USER!.trim();
      const smtpPass = process.env.SMTP_PASS!;
      const fromAddress = (process.env.EMAIL_FROM || process.env.SMTP_FROM || `"Athena Election Observatory" <${smtpUser}>`).trim();

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        replyTo: cleanEmail,
        subject: emailSubject,
        text: textBody,
        html: htmlBody
      });

      providerMessageId = info.messageId || '';
    }

    dcmRecentSubmissions.set(dedupKey, Date.now());
    return {
      statusCode: 200,
      payload: {
        success: true,
        provider: emailStatus.provider,
        messageId: providerMessageId,
        message: 'Thank you. Your DCM Brief request has been received. The AEO team will contact you using the email address provided.'
      }
    };
  } catch (err: any) {
    if (err instanceof EmailDeliveryHttpError) {
      return {
        statusCode: err.statusCode,
        payload: {
          success: false,
          code: err.code,
          error: err.message
        }
      };
    }
    console.error('[DCM Brief Request] Email delivery error:', err?.name || 'Error');
    return {
      statusCode: 502,
      payload: {
        success: false,
        error: 'Unable to send your request due to a server email delivery error. Please try again later.'
      }
    };
  } finally {
    dcmInFlightSubmissions.delete(dedupKey);
  }
}
