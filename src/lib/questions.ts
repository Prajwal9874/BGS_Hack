import type { Language } from './data';
export type Question = { id:string; language:Language; level:string; skill:'Grammar'|'Vocabulary'; prompt:string; options:string[]; answer:number; explanation:string };
type Seed = [string,string[],number,string];
// Original educational questions, not reproduced exam papers. Small starter banks.
const banks: Partial<Record<Language,Record<string,[Seed,Seed]>>> = {
 German:{
 A1:[['Ich ___ aus Indien.',['komme','kommt','kommen'],0,'With ich, kommen takes the first-person singular form komme.'],['What does das Buch mean?',['The book','The chair','The street'],0,'Buch is a neuter noun meaning book.']],
 A2:[['Gestern ___ ich einen Film gesehen.',['bin','habe','werde'],1,'Sehen forms the perfect tense with haben: ich habe gesehen.'],['What does der Bahnhof mean?',['Airport','Railway station','Library'],1,'Bahnhof means railway station.']],
 B1:[['Ich bleibe zu Hause, weil ich krank ___.',['bin','sein','ist'],0,'In a weil subordinate clause, the finite verb moves to the end.'],['What is the closest meaning of zuverlässig?',['Expensive','Reliable','Loud'],1,'A zuverlässige person can be relied upon.']],
 B2:[['Wenn ich mehr Zeit hätte, ___ ich mehr lesen.',['werde','würde','habe'],1,'The hypothetical conditional uses Konjunktiv II: würde + infinitive.'],['What does die Voraussetzung mean?',['Prerequisite','Conclusion','Advertisement'],0,'Voraussetzung describes a condition that must be fulfilled first.']],
 C1:[['Er tat so, als ___ er nichts gewusst.',['hat','hätte','wird'],1,'An unreal comparison about the past uses Konjunktiv II: als hätte er …'],['What does etwas in Kauf nehmen mean?',['Buy a gift','Accept a drawback','Cancel a plan'],1,'In Kauf nehmen means accepting an undesirable consequence.']],
 C2:[['Select the reported-speech form: Sie sagt, sie ___ bereit.',['sei','wäre gewesen','ist gewesen'],0,'Konjunktiv I sei marks neutral reported speech for sein.'],['What does sich einer Sache entziehen mean?',['Avoid or evade something','Explain something','Celebrate something'],0,'Sich entziehen means withdrawing from or evading an obligation or influence.']],
 },
 French:{
 A1:[['Je ___ étudiant.',['est','suis','sommes'],1,'Être with je is suis: je suis étudiant.'],['What does bonjour mean?',['Goodbye','Hello / good day','Thank you'],1,'Bonjour is a standard daytime greeting.']],
 A2:[['Hier, nous ___ visité Paris.',['avons','sommes','allons'],0,'Visiter takes avoir in the passé composé: nous avons visité.'],['What does une gare mean?',['A station','A school','A garden'],0,'Une gare is a railway station.']],
 B1:[['Si j’ai le temps, je ___ demain.',['viendrai','viendrais','venais'],0,'Si + present can be followed by a future result: je viendrai.'],['What does pourtant mean?',['Therefore','Yet / however','Before'],1,'Pourtant introduces a contrast with what came before.']],
 B2:[['Il faut que tu ___ à l’heure.',['es','sois','seras'],1,'Il faut que triggers the subjunctive: tu sois.'],['What does un enjeu mean?',['A stake / key issue','A toy','A mistake'],0,'Enjeu refers to what is at stake or an important issue.']],
 C1:[['Bien qu’il ___ fatigué, il continue.',['est','soit','sera'],1,'Bien que requires the subjunctive, here soit.'],['What does nuancer une affirmation mean?',['Qualify a statement','Repeat it loudly','Withdraw money'],0,'Nuancer adds distinctions or qualifications rather than treating a claim as absolute.']],
 C2:[['Encore faut-il que cela ___ possible.',['est','soit','serait'],1,'Encore faut-il que introduces a necessary condition and takes the subjunctive.'],['What does à plus forte raison mean?',['All the more so','At random','For the first time'],0,'The phrase strengthens an argument: if one case holds, the stronger case holds even more.']],
 },
 Italian:{
 A1:[['Io ___ italiano.',['parla','parlo','parli'],1,'Parlare with io is parlo.'],['What does grazie mean?',['Please','Thank you','Good evening'],1,'Grazie means thank you.']],
 A2:[['Ieri ho ___ una pizza.',['mangiare','mangiato','mangio'],1,'The passato prossimo uses avere plus the past participle mangiato.'],['What does la stazione mean?',['Station','Season','Room'],0,'La stazione commonly means the train station.']],
 B1:[['Da bambino ___ spesso al parco.',['andavo','andrò','andrei'],0,'The imperfetto describes habitual past actions: andavo.'],['What does comunque mean?',['However / anyway','Never','Only'],0,'Comunque can mean however, anyway, or in any case depending on context.']],
 B2:[['Penso che lui ___ ragione.',['ha','abbia','avrà'],1,'Penso che often introduces the congiuntivo: abbia.'],['What does una sfida mean?',['A challenge','An apology','A signature'],0,'Una sfida is a challenge.']],
 C1:[['Se lo avessi saputo, ___ venuto.',['sono','sarei','sarò'],1,'An unreal past condition uses the past conditional: sarei venuto.'],['What does dare per scontato mean?',['Take for granted','Give a discount','Make a promise'],0,'Dare per scontato means assuming something without questioning it.']],
 C2:[['Benché ___ tardi, decisero di partire.',['fosse','è','sarà'],0,'A past concessive clause with benché uses the imperfect subjunctive fosse.'],['What does dirimere una controversia mean?',['Settle a dispute','Create confusion','Delay a meeting'],0,'Dirimere means resolving or settling a contentious matter.']],
 },
 Japanese:{
 N5:[['わたし ___ がくせいです。Choose the topic particle.',['は','を','で'],0,'は marks the topic: as for me, I am a student. It is pronounced wa here.'],['What does みず mean?',['Water','Mountain','Dog'],0,'みず (水, mizu) means water.']],
 N4:[['日本へ行ったことが ___。',['います','あります','します'],1,'Verb in the past form + ことがある expresses experience.'],['What does 約束 (やくそく) mean?',['Promise / appointment','Weather','Homework'],0,'約束 means a promise or an agreed appointment.']],
 N3:[['毎日、日本語を勉強する ___ にしています。',['こと','もの','ところ'],0,'〜ことにしている expresses a decision maintained as a habit.'],['What does 確認 (かくにん) mean?',['Confirmation / checking','Departure','Disappointment'],0,'確認する means to check or confirm.']],
 N2:[['努力した ___、合格できなかった。',['にもかかわらず','ために','おかげで'],0,'〜にもかかわらず means despite; it contrasts effort with the unexpected result.'],['What does 曖昧 (あいまい) mean?',['Ambiguous / vague','Accurate','Urgent'],0,'曖昧 describes something unclear or open to multiple interpretations.']],
 N1:[['彼の実力なら、成功して ___。',['やまない','しかるべきだ','かねない'],1,'〜てしかるべきだ expresses that something is deserved or appropriate.'],['What does 顕著 (けんちょ) mean?',['Conspicuous / marked','Trivial','Temporary'],0,'顕著 describes a clearly noticeable or pronounced feature or change.']],
 },
 Korean:{
 'TOPIK 1':[['저는 학생___。Choose the polite ending.',['입니다','에서','하고'],0,'입니다 is the formal polite copula: I am a student.'],['What does 물 mean?',['Water','Fire','Book'],0,'물 (mul) means water.']],
 'TOPIK 2':[['어제 학교에 ___.',['갔어요','갈 거예요','가세요'],0,'어제 means yesterday, so the past form 갔어요 fits.'],['What does 약속 mean?',['Promise / appointment','Map','Price'],0,'약속 can mean a promise or a scheduled appointment.']],
 'TOPIK 3':[['비가 ___ 우산을 가져가세요.',['오니까','오지만','오거나'],0,'〜니까 gives a reason compatible with an instruction: because it is raining, take an umbrella.'],['What does 경험 mean?',['Experience','Competition','Result'],0,'경험 refers to experience gained from doing something.']],
 'TOPIK 4':[['실력이 늘___ 매일 연습해야 해요.',['려면','지만','거나'],0,'〜려면 expresses a condition needed to achieve an intention: if you want to improve.'],['What does 환경 mean?',['Environment','Relationship','Tradition'],0,'환경 means environment or surroundings.']],
 'TOPIK 5':[['열심히 공부했___ 불구하고 떨어졌어요.',['음에도','으려고','기 위해'],0,'〜음에도 불구하고 means despite; the result contrasts with studying hard.'],['What does 불가피하다 mean?',['To be inevitable','To be convenient','To be transparent'],0,'불가피하다 describes something that cannot be avoided.']],
 'TOPIK 6':[['전문가___ 모든 것을 알 수는 없다.',['라고 해서','기 위해서','는 동안'],0,'〜라고 해서 … 는 아니다/없다 rejects an assumed conclusion: being an expert does not mean knowing everything.'],['What does 간과하다 mean?',['To overlook','To emphasize','To negotiate'],0,'간과하다 means failing to notice or take something into account.']],
 },
 Kannada:{
 Beginner:[['Which word order is common in Kannada?',['Subject–object–verb','Verb–subject–object','Object–verb–subject'],0,'Kannada commonly puts the verb at the end: ನಾನು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ — I am learning Kannada.'],['Choose the Kannada word for water.',['ನೀರು (nīru)','ಮನೆ (mane)','ಪುಸ್ತಕ (pustaka)'],0,'ನೀರು means water; ಮನೆ means house; ಪುಸ್ತಕ means book.']],
 Intermediate:[['ನಾನು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ. What does this mean?',['I am learning Kannada','I taught Hindi','I will go home'],0,'ನಾನು means I, ಕನ್ನಡ means Kannada, and ಕಲಿಯುತ್ತಿದ್ದೇನೆ describes learning in progress.'],['What does ಮನೆ (mane) mean?',['House / home','Road','Tree'],0,'ಮನೆ means house or home.']],
 },
 Hindi:{
 Beginner:[['मैं छात्र ___।Complete the sentence.',['हूँ','है','हो'],0,'मैं takes हूँ: मैं छात्र हूँ means I am a student.'],['What does पानी (pānī) mean?',['Water','Food','Road'],0,'पानी means water.']],
 Intermediate:[['कल मैंने एक किताब ___।Choose the past form.',['पढ़ी','पढ़ा','पढ़े'],0,'In this perfective sentence, the verb agrees with feminine किताब: पढ़ी.'],['What does भरोसा (bharosā) mean?',['Trust','Noise','Distance'],0,'भरोसा means trust or confidence.']],
 },
 Tamil:{Beginner:[['Which word order is common in Tamil?',['Subject–object–verb','Verb–subject–object','Object–verb–subject'],0,'Tamil commonly uses subject–object–verb order, with the main verb at the end.'],['நீர் / தண்ணீர் refers to…',['Water','Book','House'],0,'நீர் and தண்ணீர் are words for water.']]},
 Telugu:{Beginner:[['Which word order is common in Telugu?',['Subject–object–verb','Verb–subject–object','Object–verb–subject'],0,'Telugu commonly uses subject–object–verb order, with the main verb at the end.'],['నీరు (nīru) means…',['Water','Road','Food'],0,'నీరు means water.']]},
};
export const questions:Question[] = Object.entries(banks).flatMap(([language,levels])=>Object.entries(levels!).flatMap(([level,pair])=>pair.map((q,i)=>({id:`${language}-${level}-${i}`,language:language as Language,level,skill:i===0?'Grammar' as const:'Vocabulary' as const,prompt:q[0],options:q[1],answer:q[2],explanation:q[3]}))));
export function levelsFor(language:Language) { return Object.keys(banks[language]??{}); }
