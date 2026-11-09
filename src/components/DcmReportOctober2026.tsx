import React from 'react';
import { Calendar, Shield, ExternalLink, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const DcmReportOctober2026: React.FC = () => {
  return (
    <div className="bg-white border border-line rounded-2xl p-6 sm:p-10 space-y-10 shadow-sm mb-12">
      {/* Document Header & Metadata */}
      <div className="border-b border-line pb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-brand-blue uppercase bg-brand-blue/10 px-2.5 py-1 rounded">
            ATHENA ELECTION OBSERVATORY (AEO)
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            Active / Current Monitoring Cycle
          </span>
        </div>

        <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Democratic Competitiveness Map (DCM)
        </h2>
        
        <p className="font-display font-medium text-lg sm:text-xl text-ink2">
          Nigeria’s Political Competition Environment: 29 September – 15 October 2026
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-mut pt-2 border-t border-line/60">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-ink">Cut-off date:</span>
            <span>15 October 2026</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-ink">As-at date:</span>
            <span>1st to 15th October</span>
          </div>
        </div>
      </div>

      {/* Executive Brief */}
      <section className="space-y-5 text-ink2 text-sm sm:text-base leading-relaxed">
        <h3 className="font-display font-bold text-xl sm:text-2xl text-ink">
          Executive Brief
        </h3>
        
        <p>
          As Nigeria moves into the pre-election phase of the 2027 general elections, political competition continues to take different forms across states. The Democratic Competitiveness Map (DCM) provides an evidence-based assessment of whether political environments are open, experiencing emerging pressure points, or facing more significant constraints.
        </p>
        
        <p>
          This second DCM assessment identifies a political environment characterised by renewed attacks on political mobilisation, threatening electoral rhetoric, contested access to political assembly and unresolved questions about the impartiality of institutional responses. The evidence is concentrated in a limited number of states rather than indicating a uniform national restriction.
        </p>

        <div className="space-y-3 pt-2">
          <p className="font-semibold text-ink">
            The strongest concerns emerging from this reporting window are concentrated around:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Political violence affecting opposition candidates, party supporters and campaign activities.</li>
            <li>Restrictions or disruptions affecting political gatherings and mobilisation.</li>
            <li>Unresolved questions about the investigation of attacks and the treatment of political actors.</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <p className="font-semibold text-ink">
            The principal classification changes arising from this reporting window are:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-ink">Edo</strong> — Orange (Constrained)</li>
            <li><strong className="text-ink">Oyo</strong> — Orange (Constrained)</li>
            <li><strong className="text-ink">Kano</strong> — Amber (Emerging Concern)</li>
          </ul>
        </div>

        <p className="pt-2">
          Enugu remains Orange and Kogi remains Amber. Benue and Delta remain Orange, and Abia, Anambra, Imo, Kaduna, Osun and Rivers remain Amber, on the basis of conditions carried forward from the first assessment. These classifications reflect the new evidence and its implications for political competition, rather than a presumption that every reported incident was politically sponsored.
        </p>
      </section>

      {/* Reading the Map: What the Classifications Mean */}
      <section className="space-y-6 text-ink2 text-sm sm:text-base leading-relaxed border-t border-line pt-8">
        <h3 className="font-display font-bold text-xl sm:text-2xl text-ink">
          Reading the Map: What the Classifications Mean
        </h3>

        <p>
          The DCM colours indicate the current state of political competition, not permanent judgements about individual states. They show whether available evidence points to material constraints, emerging concerns, broadly open competition or insufficient evidence to reach a responsible conclusion. The table below shows the classification of all 37 assessment units as at the cut-off date of 15 October 2026, after the evidence from this reporting window has been incorporated into the first assessment.
        </p>

        {/* Classification Summary Table */}
        <div className="overflow-x-auto border border-line rounded-xl my-6">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-paper border-b border-line text-ink font-mono uppercase tracking-wider">
                <th className="p-3.5 sm:p-4 font-bold min-w-[160px]">Classification</th>
                <th className="p-3.5 sm:p-4 font-bold min-w-[240px]">Meaning</th>
                <th className="p-3.5 sm:p-4 font-bold min-w-[200px]">States Classified</th>
                <th className="p-3.5 sm:p-4 font-bold text-center w-28">Number of States</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink2">
              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
                  Orange — Constrained
                </td>
                <td className="p-3.5 sm:p-4">
                  Verified incidents or patterns materially affecting political competition
                </td>
                <td className="p-3.5 sm:p-4 font-medium text-ink">
                  Benue, Delta, Edo, Enugu, Oyo
                </td>
                <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-ink">
                  5
                </td>
              </tr>
              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                  Amber — Emerging Concern
                </td>
                <td className="p-3.5 sm:p-4">
                  Material concerns exist, but the evidence does not yet demonstrate a sustained restrictive pattern
                </td>
                <td className="p-3.5 sm:p-4 font-medium text-ink">
                  Abia, Anambra, Imo, Kaduna, Kano, Kogi, Osun, Rivers
                </td>
                <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-ink">
                  8
                </td>
              </tr>
              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 shrink-0"></span>
                  Grey — Insufficient Evidence
                </td>
                <td className="p-3.5 sm:p-4">
                  Evidence is insufficient to classify political competition conditions responsibly
                </td>
                <td className="p-3.5 sm:p-4 font-medium text-ink">
                  23 states and the FCT
                </td>
                <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-ink">
                  24
                </td>
              </tr>
              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                  Green — Open
                </td>
                <td className="p-3.5 sm:p-4">
                  Evidence indicates broadly open competitive conditions
                </td>
                <td className="p-3.5 sm:p-4 italic text-mut">
                  None classified as at 15 October 2026
                </td>
                <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-ink">
                  0
                </td>
              </tr>
              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 shrink-0"></span>
                  Red — Severely Constrained
                </td>
                <td className="p-3.5 sm:p-4">
                  Evidence establishes serious and sustained restrictions substantially affecting competition
                </td>
                <td className="p-3.5 sm:p-4 italic text-mut">
                  None classified as at 15 October 2026
                </td>
                <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-ink">
                  0
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-mut italic bg-paper p-3.5 rounded-lg border border-line">
          <strong>Note:</strong> The first assessment reported “27 states and the FCT” as Grey. Because ten states were classified Orange or Amber, the correct figure was 26 states and the FCT (27 assessment units). The figures above are calculated from the corrected baseline.
        </p>
      </section>

      {/* Key Signals Emerging from the Current Map */}
      <section className="space-y-8 text-ink2 text-sm sm:text-base leading-relaxed border-t border-line pt-8">
        <h3 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          Key Signals Emerging from the Current Map
        </h3>

        {/* 1. Political mobilisation faced serious interference */}
        <div className="space-y-5">
          <h4 className="font-display font-bold text-lg sm:text-xl text-ink">
            1. Political mobilisation faced serious interference
          </h4>
          
          <p>
            The most significant developments during this reporting window involved threats, attacks and disruption affecting political activities in Edo, Enugu, Kogi and Oyo. Although responsibility remains unresolved in several cases, the incidents raise concerns about the conditions under which parties and candidates can organise and mobilise ahead of 2027.
          </p>

          <div className="space-y-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-line">
            {/* Edo */}
            <div className="space-y-2">
              <h5 className="font-display font-bold text-base text-ink">Edo</h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  On 2 October, Edo APC chairman Jarrett Tenebe, addressing supporters about the party’s target of delivering 2.5 million votes for President Tinubu in 2027, said that anyone who stood in the way of that target would face “AK-47 fire”. The remark was recorded on video and published by several media organisations, so the making of the statement is established. A human rights organisation has asked the DSS to investigate it. AEO has not located a public clarification by Mr Tenebe. (Evidence status: Verified Incident as to the statement made.)
                </li>
                <li>
                  On 6 October, an ADC convoy carrying senatorial candidate Herberta Okonofua and party chieftain Kenneth Imansuangbon was reportedly attacked by gunmen in Igueben Local Government Area. An ADC supporter was reported injured. The party alleged political involvement, which has not been independently established. The two men have petitioned the police and the DSS for a full investigation. (Evidence status: Verified Incident as to the attack, corroborated by three independent reports; Allegation as to political involvement.)
                </li>
                <li>
                  On 13 October, an attack on the NDC secretariat in Ikpoba-Okha was reported. The allegation that APC-linked actors were responsible remains unverified. This account rests on a single report and is recorded as provisional. (Evidence status: Allegation.)
                </li>
              </ul>
            </div>

            {/* Oyo */}
            <div className="space-y-2 pt-2">
              <h5 className="font-display font-bold text-base text-ink">Oyo</h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  On 14 October, suspected attackers disrupted a procession in Molete, Ibadan South-West, organised to welcome Accord governorship candidate Oriyomi Hamzat back to Nigeria.
                </li>
                <li>
                  On 15 October, police confirmed that a supporter, Azeez Tajudeen, had died from injuries sustained in the attack. The identities and political affiliations of the attackers remain unestablished. (Evidence status: Verified Incident as to the attack and the death, confirmed by the police; Allegation as to political motive.) [AEO to confirm the status of the police investigation and any arrests at the cut-off date.]
                </li>
              </ul>
            </div>

            {/* Enugu */}
            <div className="space-y-2 pt-2">
              <h5 className="font-display font-bold text-base text-ink">Enugu</h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  On 10 October, NDC supporters gathered at the entrance to Akanu Ibiam International Airport to receive the party’s governorship candidate, Chinyeaka Ohaa, ahead of the party’s campaign flag-off. According to the police, joint police and military personnel dispersed the gathering after airport authorities restricted entry in large numbers. The Enugu State Government said the NDC had not obtained approval from the Federal Airports Authority of Nigeria (FAAN) and described the confrontation as a matter between the party and federal authorities. The NDC disputed this account. The airport is administered by a federal institution, and this brief does not attribute the dispersal to the state government.
                </li>
                <li>
                  Later the same day, shooting occurred outside the NDC secretariat in the GRA area of Enugu during the party’s campaign flag-off. The police reported that one man was injured and five parked vehicles were damaged, and the Commissioner of Police directed the State Criminal Investigation Department to investigate. The police account indicated that the injured man survived; the NDC subsequently reported that a member had died. These accounts had not been reconciled by the cut-off date. The Enugu State Government condemned the attack, denied any involvement and rejected an allegation that the Governor’s Chief Security Officer was present. The airport and secretariat events are treated as one linked incident. (Evidence status: Verified Incident as to the shooting; disputed as to fatality and responsibility.)
                </li>
              </ul>
            </div>

            {/* Kogi */}
            <div className="space-y-2 pt-2">
              <h5 className="font-display font-bold text-base text-ink">Kogi</h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  On 3 October, an ADC campaign convoy carrying Musa Ahmadu, the party’s Kogi West senatorial candidate, and Quincy Ahmed, its candidate for the Lokoja/Koton-Karfe Federal Constituency, was attacked during a voter-mobilisation outing at Gegu-Beki, near Koton-Karfe in Kogi Local Government Area. Several vehicles and campaign materials were destroyed. The ADC called on the police to intervene. The attackers’ identities and political affiliations remain unverified. (Evidence status: Verified Incident as to the attack; Allegation as to political responsibility.)
                </li>
              </ul>
            </div>

            {/* Why this matters for 2027 */}
            <div className="bg-paper p-4 rounded-xl border border-line mt-4">
              <p className="font-bold text-ink mb-1">Why this matters for 2027</p>
              <p className="text-sm">
                Political competition depends on parties’ ability to organise, travel, hold meetings and mobilise supporters without violence. The reported fatal attack in Oyo and the fresh incidents in Edo and Enugu are serious warning signs. The effectiveness and impartiality of investigations will be important in determining whether these remain individual incidents or indicate a broader deterioration in competitive conditions.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Political assembly and campaign access remain contested */}
        <div className="space-y-5 border-t border-line/60 pt-6">
          <h4 className="font-display font-bold text-lg sm:text-xl text-ink">
            2. Political assembly and campaign access remain contested
          </h4>

          <div className="space-y-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-line">
            {/* Kano */}
            <div className="space-y-2">
              <h5 className="font-display font-bold text-base text-ink">Kano</h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  On 11 October, the Kano State Police Command of the Nigeria Police Force, a federal institution, blocked access to a privately hired venue where the “Tinubu Must Go” movement intended to hold a meeting.
                </li>
                <li>
                  The organiser said the venue had been booked and paid for. The police commissioner defended the intervention on security grounds, arguing that prior notification would have enabled the command to prepare for the gathering.
                </li>
                <li>
                  The available reporting does not establish whether comparable gatherings by other political actors in Kano proceeded without prior notification, or whether prior notification was legally required for a meeting at a private venue. Both are recorded as evidence gaps.
                </li>
              </ul>
              <p className="pt-2 text-sm">
                The incident raises concerns about access to political assembly. However, the available evidence does not establish a sustained pattern of restriction, and the police explanation must be considered alongside the organisers’ account.
              </p>
            </div>

            {/* Enugu */}
            <div className="space-y-2 pt-2">
              <h5 className="font-display font-bold text-base text-ink">Enugu</h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  On 8 and 9 October, two media outlets reported a Federal High Court judgment on the ₦150 million campaign billboard permit fee imposed through the Enugu State Signage and Advertisement Agency (ENSSAA). Their accounts differ: one reported that the court struck out the fee, while the other reported contradictions between the court’s reasoning and its final orders. The judgment was reported as restricting enforcement until after the general elections. The date of the judgment is [AEO to confirm].
                </li>
                <li>
                  The reported ruling is a potentially important remedy to the campaign-access concern identified in the previous assessment. However, the precise legal effect requires confirmation from the enrolled order or certified judgment. Until the certified judgment is obtained, the remedy is recorded as reported but unconfirmed, and its effectiveness cannot yet be assessed.
                </li>
              </ul>
            </div>

            {/* Why this matters for 2027 */}
            <div className="bg-paper p-4 rounded-xl border border-line mt-4">
              <p className="font-bold text-ink mb-1">Why this matters for 2027</p>
              <p className="text-sm">
                Campaign access involves more than the formal right to contest an election. Candidates and parties must also be able to hold meetings, use venues and communicate with voters. Security restrictions and campaign regulations therefore require scrutiny for their practical effects and consistency of application.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Institutional responses will influence whether concerns escalate */}
        <div className="space-y-5 border-t border-line/60 pt-6">
          <h4 className="font-display font-bold text-lg sm:text-xl text-ink">
            3. Institutional responses will influence whether concerns escalate
          </h4>

          <p>
            Several developments during the reporting window concern how institutions have responded to political disputes and allegations.
          </p>

          <div className="space-y-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-line">
            {/* Enugu: prosecution linked to the September attack */}
            <div className="space-y-2">
              <h5 className="font-display font-bold text-base text-ink">
                Enugu: prosecution linked to the September attack
              </h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  On 5 October, Ani Samuel Chidi was arraigned on charges involving alleged cybercrime and criminal defamation relating to material published about the 12 September NDC meeting attack.
                </li>
                <li>
                  The NDC questioned the prosecution, and one report described Mr Chidi as the man who filmed the attack. The police said the case concerned alleged cyberbullying, false allegations and threats, not the filming. These competing accounts remain unresolved, and the prosecution does not resolve responsibility for the September incident. AEO will monitor the case as a possible Security Neutrality concern, because the prosecution of a person who documented an attack on a political meeting may discourage the documentation of political violence. It does not by itself change Enugu’s classification.
                </li>
              </ul>
            </div>

            {/* Reported TikTok access difficulties */}
            <div className="space-y-2 pt-2">
              <h5 className="font-display font-bold text-base text-ink">
                Reported TikTok access difficulties
              </h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  During October, civil society organisations called for an investigation into reported access difficulties affecting TikTok users in Kaduna, Kano, Kebbi and Sokoto. [Source required: civil society statement.]
                </li>
                <li>
                  On 12 October, TikTok denied implementing the restriction and said it was engaging relevant stakeholders. The cause of the disruption remained unclear.
                </li>
              </ul>
              <p className="pt-2 text-sm">
                The available evidence does not establish that a state government directed the disruption or that it was intended to restrict election-related communication. The matter is recorded in the national layer as a monitoring lead rather than as state-level evidence.
              </p>
            </div>

            {/* Sowore trial */}
            <div className="space-y-2 pt-2">
              <h5 className="font-display font-bold text-base text-ink">
                Sowore trial
              </h5>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  The scheduled 6 October hearing in the cybercrime case involving Omoyele Sowore did not proceed because the judge was unavailable following a bereavement. The matter was adjourned to 19 October. [Source required.]
                </li>
                <li>
                  The adjournment was a procedural development and does not, by itself, establish a new restriction on political competition in the FCT.
                </li>
              </ul>
            </div>

            {/* Why this matters for 2027 */}
            <div className="bg-paper p-4 rounded-xl border border-line mt-4">
              <p className="font-bold text-ink mb-1">Why this matters for 2027</p>
              <p className="text-sm">
                The direction of political competition depends not only on whether incidents occur, but also on whether institutions investigate them credibly, explain their decisions and apply relevant rules consistently. Unresolved allegations should remain distinct from established findings, while judicial remedies and official responses should be reflected in subsequent assessments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Changed Since the First DCM Assessment */}
      <section className="space-y-6 text-ink2 text-sm sm:text-base leading-relaxed border-t border-line pt-8">
        <h3 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          What Changed Since the First DCM Assessment
        </h3>

        <p>
          The first assessment covered 1 July–28 September 2026. The following changes reflect developments during the present reporting window. Each classification reflects the conditions in force at the cut-off date of 15 October 2026, not a count of incidents.
        </p>

        <div className="space-y-4 pl-0 sm:pl-4">
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <strong className="text-ink">Edo: Grey to Orange.</strong> Two incidents are established: the 2 October “AK-47 fire” statement by the state chairman of the governing party, which is documented on video, and the 6 October gun attack on an ADC convoy carrying a senatorial candidate, which is corroborated by three independent reports. This brief does not link the two incidents causally. The reported attack on the NDC secretariat is recorded as provisional and does not support the classification. Amber was considered and rejected: the evidence goes beyond a single material incident, combining a public threat of armed violence by a senior official of the governing party with an armed attack on an opposition candidate’s convoy within the same week. Together these materially affect the conditions under which opposition actors can campaign in the state. Red was rejected because the evidence does not establish sustained or systemic restriction, and political responsibility for the convoy attack is not established.
            </li>
            <li>
              <strong className="text-ink">Oyo: Grey to Orange.</strong> The classification rests on one incident: the 14 October attack on a procession welcoming the Accord governorship candidate, in which a supporter died, as confirmed by the police on 15 October. Amber was considered, because the incident occurred in one LGA and the attackers’ identities and motives are unestablished. Orange was preferred because a single exceptionally serious and well-documented action may support Orange, and a police-confirmed fatal attack on a candidate’s supporters during political mobilisation meets that description. Red was rejected because there is no evidence of sustained or systemic restriction. The classification will be reconsidered at the next cut-off in the light of the investigation and any further incidents.
            </li>
            <li>
              <strong className="text-ink">Kano: Grey to Amber.</strong> On 11 October, the Kano State Police Command, a federal institution, blocked access to a privately booked venue for a meeting of the “Tinubu Must Go” movement, citing security grounds and the absence of prior notification. This is a material incident affecting political assembly. Orange was rejected because it is a single event, no pattern has been shown and no comparator evidence has yet been found. Grey was rejected because the police action is acknowledged by the police and reported by two independent outlets.
            </li>
            <li>
              <strong className="text-ink">Enugu remains Orange.</strong> Fresh violence affecting NDC activities reinforces the existing classification. The reported court ruling on the campaign-advertising levy is a potentially mitigating development, but it does not remove the separate concerns arising from political violence. The 10 October events comprised a dispersal at the airport by federal authorities and a shooting at the NDC secretariat that is under police investigation. Amber was rejected because the violence affecting opposition parties identified in the first assessment remains unresolved and further violence occurred in this window. Red was rejected because the state government has condemned the attack, the police have opened investigations and opposition parties have continued to campaign.
            </li>
            <li>
              <strong className="text-ink">Kogi remains Amber.</strong> The reported October attack on ADC candidates adds to the concerns arising from the September attack on an ADC ward meeting. The evidence does not yet establish the perpetrators’ identities or a sufficiently verified sustained pattern to justify reclassification. Orange was considered because ADC activity has now been attacked in successive months, but it was rejected because neither incident has established perpetrators or political responsibility, and the two incidents occurred in different localities. Grey was rejected because both attacks are independently reported and acknowledged by the affected party.
            </li>
            <li>
              <strong className="text-ink">Benue and Delta remain Orange.</strong> These classifications are carried forward because [AEO to state, for each state, the restrictive condition that remains in force at 15 October, for example an unresolved investigation]. A classification is carried forward only while its restrictive condition remains in force. If no such condition remains at the cut-off date, the classification should be reconsidered in this window.
            </li>
            <li>
              <strong className="text-ink">Abia, Anambra, Imo, Kaduna, Osun and Rivers remain Amber.</strong> No evidence in this window shows that the conditions identified in the first assessment have been remedied or have worsened, and those conditions are carried forward. [AEO to confirm for each state that the relevant condition remains in force at 15 October, including the effect of the Imo billboard injunction.] The reported TikTok access difficulties do not independently establish state-directed restrictions in Kaduna.
            </li>
          </ul>
        </div>
      </section>

      {/* State-by-State Evidence Table */}
      <section className="space-y-6 text-ink2 text-sm sm:text-base leading-relaxed border-t border-line pt-8">
        <div className="space-y-1">
          <h4 className="font-display font-bold text-xl sm:text-2xl text-ink">
            Key Evidence: 29 September–15 October 2026
          </h4>
          <p className="text-xs text-mut font-mono">
            State-by-state assessment of incidents and evidentiary foundations recorded during this cycle.
          </p>
        </div>

        <div className="overflow-x-auto border border-line rounded-xl my-4">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-paper border-b border-line text-ink font-mono uppercase tracking-wider">
                <th className="p-3.5 sm:p-4 font-bold min-w-[150px] w-44">State / FCT</th>
                <th className="p-3.5 sm:p-4 font-bold min-w-[180px] w-56">DCM Classification</th>
                <th className="p-3.5 sm:p-4 font-bold min-w-[320px]">Key Evidence: 29 September–15 October 2026</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink2">
              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Edo</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-800 border border-orange-200 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Orange — Constrained
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  On 2 October, APC chairman Jarrett Tenebe invoked “AK-47 fire” while discussing the party’s 2027 vote target. On 6 October, an ADC convoy was reportedly attacked, injuring a supporter. An attack on an NDC secretariat was reported on 15 October, but responsibility remains unverified.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Enugu</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-800 border border-orange-200 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Orange — Constrained
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  On 5 October, Ani Samuel Chidi was arraigned over publications linked to the September NDC attack. On 8 October, a court ruling on the ₦150 million campaign-advertising levy was reported. On 10 October, confrontations affected NDC activities at the airport and secretariat; the NDC subsequently reported a member’s death following the secretariat shooting.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Federal Capital Territory (FCT)</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Grey — Insufficient Evidence
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  The Sowore trial hearing scheduled for 6 October was adjourned to 19 October because the judge was unavailable. This procedural development does not independently establish a new restriction on political competition.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Kaduna</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Grey — Insufficient Evidence
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  Reported TikTok access difficulties resurfaced during the window. The cause remained unclear, and no state-directed restriction affecting political competition was established.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Kano</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Amber — Emerging Concern
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  On 11 October, police blocked access to a privately hired venue for the “Tinubu Must Go” movement’s meeting. Organisers disputed the restriction, while police cited security concerns and inadequate prior notification.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Kebbi</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Grey — Insufficient Evidence
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  Reports of TikTok access difficulties received further attention during the window, but their cause and any connection to state-directed restrictions remained unestablished.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Kogi</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Amber — Emerging Concern
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  On 3 October, the ADC reported that two candidates were attacked during political activity in Koton-Karfe LGA. Campaign vehicles and materials were reportedly damaged; the attackers’ identities and political affiliations remain unverified.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Oyo</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-800 border border-orange-200 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Orange — Constrained
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  On 14 October, suspected attackers disrupted an Accord Party procession in Ibadan. On 15 October, police confirmed that a supporter had died from injuries sustained in the attack. The attackers’ identities and political affiliations remain unestablished.
                </td>
              </tr>

              <tr className="hover:bg-paper/40 transition-colors">
                <td className="p-3.5 sm:p-4 font-bold text-ink align-top">Sokoto</td>
                <td className="p-3.5 sm:p-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Grey — Insufficient Evidence
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 leading-relaxed">
                  Reported TikTok access difficulties resurfaced during the window, but the cause and any state-directed restriction affecting political competition remained unestablished.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* The DCM and the 2027 Election Environment */}
      <section className="space-y-5 text-ink2 text-sm sm:text-base leading-relaxed border-t border-line pt-8">
        <h3 className="font-display font-bold text-xl sm:text-2xl text-ink">
          The DCM and the 2027 Election Environment
        </h3>

        <p>
          The value of the DCM is that it moves analysis beyond election-day events.
        </p>

        <p className="font-semibold text-ink">
          Competitive elections depend on conditions that develop before voting begins:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>Whether parties can organise and mobilise supporters safely.</li>
          <li>Whether candidates can campaign and hold political gatherings.</li>
          <li>Whether security institutions protect political activity impartially.</li>
          <li>Whether campaign regulations are applied fairly.</li>
          <li>Whether disputes are investigated and resolved through credible institutions.</li>
        </ul>

        <p className="pt-2">
          New evidence in this window is concentrated in Edo, Enugu, Kogi and Oyo, alongside an emerging concern about political assembly in Kano. Benue and Delta remain Orange on carried-forward conditions. The next assessment should establish whether investigations produce credible outcomes, whether political activity can continue without further disruption, and whether the reported incidents develop into sustained patterns.
        </p>

        <p className="pt-2 italic">
          The map remains an assessment of evidenced conditions for political competition, not a judgement about the political affiliation or culpability of alleged perpetrators.
        </p>
      </section>

      {/* Right of Response */}
      <section className="space-y-4 text-ink2 text-sm sm:text-base leading-relaxed border-t border-line pt-8 bg-paper p-5 sm:p-6 rounded-xl border border-line">
        <h4 className="font-display font-bold text-lg sm:text-xl text-ink flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-blue" />
          Right of Response
        </h4>

        <p className="text-xs sm:text-sm">
          Before publication, AEO seeks responses on the material factual propositions supporting the new Orange classifications and the attribution of the 2 October statement. [AEO to complete for each: Edo APC and Jarrett Tenebe (2 October statement); Edo State Police Command (6 October convoy attack); Oyo State Police Command (14 October attack); date sent, response deadline and response received.] Where a response remains pending at publication, this is recorded and the relevant evidence is not withheld.
        </p>
      </section>

      {/* Sources */}
      <section className="space-y-6 text-ink2 text-xs sm:text-sm leading-relaxed border-t border-line pt-8">
        <h3 className="font-display font-bold text-xl sm:text-2xl text-ink flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-blue" />
          Sources
        </h3>

        <ol className="list-decimal pl-5 space-y-3 font-sans break-words">
          <li>
            TheCable, “Edo APC Chair Threatens ‘AK-47 Fire’ for Those Opposing Tinubu’s 2.5m Votes,” 2 October 2026.{' '}
            <a 
              href="https://www.thecable.ng/edo-apc-chairman-threatens-ak-47-fire-for-those-opposing-tinubus-2-5m-votes/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.thecable.ng/edo-apc-chairman-threatens-ak-47-fire-for-those-opposing-tinubus-2-5m-votes/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Punch, “ADC Supporter Injured in Edo Gun Attack,” 7 October 2026.{' '}
            <a 
              href="https://punchng.com/adc-supporter-injured-in-edo-gun-attack/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://punchng.com/adc-supporter-injured-in-edo-gun-attack/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Vanguard, “Edo: ADC Candidate, Imasuangbon Escape Gun Attack,” 7 October 2026.{' '}
            <a 
              href="https://www.vanguardngr.com/2026/10/edo-adc-candidate-imansuagbon-escape-gun-attack/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.vanguardngr.com/2026/10/edo-adc-candidate-imansuagbon-escape-gun-attack/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Independent, “Igueben Attack: Imasuangbon, Okonofua Petition Police, DSS, Demand Full Investigation,” 10 October 2026.{' '}
            <a 
              href="https://independent.ng/igueben-attack-imasuangbon-okonofua-petition-dss-demand-full-investigation/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://independent.ng/igueben-attack-imasuangbon-okonofua-petition-dss-demand-full-investigation/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            The Morning Report, “NDC Secretariat Set Ablaze in Edo,” 15 October 2026.{' '}
            <a 
              href="https://www.ngmorningreport.com/p/ndc-secretariat-set-ablaze-in-edo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.ngmorningreport.com/p/ndc-secretariat-set-ablaze-in-edo
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Premium Times, “VIDEO: Sporadic Shootings as Thugs Attack NDC Supporters in Enugu,” 10 October 2026.{' '}
            <a 
              href="https://www.premiumtimesng.com/regional/ssouth-east/916042-video-sporadic-shootings-as-thugs-attack-ndc-supporters-in-enugu.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.premiumtimesng.com/regional/ssouth-east/916042-video-sporadic-shootings-as-thugs-attack-ndc-supporters-in-enugu.html
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Premium Times, “Enugu Govt Condemns Attack on NDC Members,” 11 October 2026.{' '}
            <a 
              href="https://www.premiumtimesng.com/regional/ssouth-east/916221-enugu-govt-condemns-attack-on-ndc-members.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.premiumtimesng.com/regional/ssouth-east/916221-enugu-govt-condemns-attack-on-ndc-members.html
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Premium Times, “Police Order Investigation into Shootings at Enugu NDC Secretariat,” 12 October 2026.{' '}
            <a 
              href="https://www.premiumtimesng.com/regional/ssouth-east/916336-police-order-investigation-into-shootings-at-enugu-ndc-secretariat.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.premiumtimesng.com/regional/ssouth-east/916336-police-order-investigation-into-shootings-at-enugu-ndc-secretariat.html
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Kogi Reports, “2027 Polls: KOSSAA Warns Against Destruction of Political Billboards, Posters in Kogi State,” [day] October 2026.{' '}
            <a 
              href="https://kogireports.com/2027-polls-kossaa-warns-against-destruction-of-political-billboards-posters-in-kogi-state/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://kogireports.com/2027-polls-kossaa-warns-against-destruction-of-political-billboards-posters-in-kogi-state/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Situation Room, “Election News Trend: October 2026,” [day] October 2026.{' '}
            <a 
              href="https://situationroomng.org/election-news-trend-october-2026/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://situationroomng.org/election-news-trend-october-2026/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Punch, “Police Confirm Attack on Accord’s Oriyomi Hamzat’s Supporters in Oyo,” 14 October 2026.{' '}
            <a 
              href="https://punchng.com/police-confirm-attack-on-accords-oriyomi-hamzats-supporters-in-oyo/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://punchng.com/police-confirm-attack-on-accords-oriyomi-hamzats-supporters-in-oyo/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Channels Television, “One Dead as Suspected Hoodlums Attack Oriyomi Hamzat’s Supporters in Oyo — Police,” 15 October 2026.{' '}
            <a 
              href="https://www.channelstv.com/2026/10/15/one-dead-as-suspected-hoodlums-attack-oriyomi-hamzats-supporters-in-oyo-police/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.channelstv.com/2026/10/15/one-dead-as-suspected-hoodlums-attack-oriyomi-hamzats-supporters-in-oyo-police/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            The Whistler, “Police Barricade Venue of Anti-Tinubu Meeting, Convener Protests,” [day] October 2026.{' '}
            <a 
              href="https://thewhistler.ng/police-barricade-venue-of-anti-tinubu-meeting-convener-protests/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://thewhistler.ng/police-barricade-venue-of-anti-tinubu-meeting-convener-protests/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            BusinessDay, “Police Block Venue of Anti-Tinubu Meeting in Kano, Conveners Protest,” [day] October 2026.{' '}
            <a 
              href="https://businessday.ng/politics/article/police-block-venue-of-anti-tinubu-meeting-in-kano-conveners-protest/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://businessday.ng/politics/article/police-block-venue-of-anti-tinubu-meeting-in-kano-conveners-protest/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Brand Communicator, “Court Strikes Out N150m Campaign Billboard Fine Imposed on Opposition Parties in Enugu State,” 9 October 2026.{' '}
            <a 
              href="https://brandcom.ng/2026/10/09/court-strikes-out-n150m-campaign-billboard-fine-imposed-on-opposition-parties-in-enugu-state/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://brandcom.ng/2026/10/09/court-strikes-out-n150m-campaign-billboard-fine-imposed-on-opposition-parties-in-enugu-state/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Enugu Mandate, “Legal Paradox in Enugu: Federal High Court’s Judgment on ₦150 Million ENSSAA Campaign Permit Reveals Deep Contradictions,” 8 October 2026.{' '}
            <a 
              href="https://www.enugumandatenews.com/legal-paradox-in-enugu-federal-high-courts-judgment-on-n150-million-enssaa-campaign-permit-reveals-deep-contradictions-between-reasoning-and-final-orders" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.enugumandatenews.com/legal-paradox-in-enugu-federal-high-courts-judgment-on-n150-million-enssaa-campaign-permit-reveals-deep-contradictions-between-reasoning-and-final-orders
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Premium Times, “Court Remands Man Who Filmed Attack on NDC Members,” [day] October 2026.{' '}
            <a 
              href="https://www.premiumtimesng.com/news/top-news/915232-court-remands-man-who-filmed-attack-on-ndc-members.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.premiumtimesng.com/news/top-news/915232-court-remands-man-who-filmed-attack-on-ndc-members.html
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Punch, “Enugu Man’s Arrest Linked to Cyberbullying, Not Filming Attack — Police,” [day] October 2026.{' '}
            <a 
              href="https://punchng.com/enugu-mans-arrest-linked-to-cyberbullying-not-filming-attack-police/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://punchng.com/enugu-mans-arrest-linked-to-cyberbullying-not-filming-attack-police/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Premium Times, “TikTok Denies Responsibility for Limited Access in Northern Nigeria,” 12 October 2026.{' '}
            <a 
              href="https://www.premiumtimesng.com/news/more-news/916449-tiktok-denies-responsibility-for-limited-access-in-northern-nigeria.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.premiumtimesng.com/news/more-news/916449-tiktok-denies-responsibility-for-limited-access-in-northern-nigeria.html
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Daily Trust, “Thugs Attack ADC Campaign Train in Kogi, Vehicles Destroyed,” 5 October 2026.{' '}
            <a 
              href="https://dailytrust.com/thugs-attack-adc-campaign-train-in-kogi-vehicles-destroyed/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://dailytrust.com/thugs-attack-adc-campaign-train-in-kogi-vehicles-destroyed/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            ThisDay, “Enugu Alleges Plot by Opposition to Import Thugs, Destabilise State Ahead of 2027 Polls,” 12 October 2026.{' '}
            <a 
              href="https://www.thisdaylive.com/2026/10/12/enugu-alleges-plot-by-opposition-to-import-thugs-destabilise-state-ahead-of-2027-polls/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.thisdaylive.com/2026/10/12/enugu-alleges-plot-by-opposition-to-import-thugs-destabilise-state-ahead-of-2027-polls/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Arise News, “HURIWA Calls for DSS Probe of Edo APC Chairman Over ‘AK-47 Fire’ Remark,” [day] October 2026.{' '}
            <a 
              href="https://www.arise.tv/huriwa-calls-for-dss-probe-of-edo-apc-chairman-over-ak-47-fire-remark/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://www.arise.tv/huriwa-calls-for-dss-probe-of-edo-apc-chairman-over-ak-47-fire-remark/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            Leadership, “ADC Condemns APC Over AK-47 Threat, Says Party Plotting Violence Ahead of 2027,” [day] October 2026.{' '}
            <a 
              href="https://leadership.ng/adc-condemns-apc-over-ak-47-threat-says-party-plotting-violence-ahead-of-2027/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://leadership.ng/adc-condemns-apc-over-ak-47-threat-says-party-plotting-violence-ahead-of-2027/
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            TheNigeriaLawyer, [title to be confirmed: report of the Enugu State Police Command statement on the airport dispersal and NDC secretariat shooting], [day] October 2026.{' '}
            <a 
              href="https://thenigerialawyer.com/?p=474428" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-blue hover:underline break-all inline-flex items-center gap-0.5"
            >
              https://thenigerialawyer.com/?p=474428
              <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
            </a>
          </li>
          <li>
            [Source required: civil society call for investigation into TikTok access difficulties.]
          </li>
          <li>
            [Source required: Sowore hearing of 6 October and adjournment.]
          </li>
        </ol>

        <p className="text-xs text-mut italic pt-3 border-t border-line/60">
          Access dates for each source are to be added from the DCM source register. [AEO to complete.]
        </p>
      </section>
    </div>
  );
};

export default DcmReportOctober2026;
