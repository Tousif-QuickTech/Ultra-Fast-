/* Mock data layer – replace with Laravel API responses later. Bilingual fields are {bn,en}. */
const MOCK=(()=>{
const N=30,days=[...Array(N)].map((_,i)=>new Date(2026,8,28+i).getTime());
const sales=days.map((_,i)=>310000+((i*37)%11)*21000+(i%7===5?-110000:0)+i*2500);
const coll=sales.map((s,i)=>Math.round(s*(0.55+((i*13)%7)*0.04)/1000)*1000);
const purch=days.map((_,i)=>i%9===3?1450000+(i%4)*210000:0);
const months=[...Array(12)].map((_,j)=>new Date(2025,10+j,1).getTime());
const ms=months.map((_,j)=>8400000+((j*5)%7)*550000+j*180000);
const P=(bn,en,cat,kg,min,cost,price,sold)=>({n:{bn,en},cat,kg,min,cost,price,sold});
return{days,daily:{sales,coll,purch},months,monthly:{sales:ms,coll:ms.map(v=>Math.round(v*.78)),purch:months.map((_,j)=>4500000+((j*3)%5)*900000)},
expenses:1185000,cogsRate:.74,
products:[P('ক্রাফট পেপার ১২০ জিএসএম','Kraft Paper 120 GSM','paper',42500,15000,98,112,18400),P('ডুপ্লেক্স বোর্ড ৩০০ জিএসএম','Duplex Board 300 GSM','board',6800,7000,86,99,12250),
P('হোয়াইট টপ লাইনার ১৫০ জিএসএম','White Top Liner 150 GSM','paper',28900,10000,112,129,9600),P('বিওপিপি ফিল্ম ২০ মাইক্রন','BOPP Film 20 Micron','film',3200,8000,182,208,7300),
P('করুগেটেড মিডিয়াম ১০০ জিএসএম','Corrugated Medium 100 GSM','paper',35200,12000,74,86,14900),P('স্ট্রেচ ফিল্ম ২৩ মাইক্রন','Stretch Film 23 Micron','film',2100,5000,165,189,4100),
P('এলডিপিই গ্র্যানিউলস','LDPE Granules','raw',24300,9000,128,146,6800),P('গ্রে বোর্ড ৮০০ জিএসএম','Grey Board 800 GSM','board',18700,8000,64,76,8200)],
customers:[{bn:'রহমান প্যাকেজিং লিমিটেড',en:'Rahman Packaging Ltd',v:2840000,due:1240000,days:74},{bn:'মেঘনা কার্টন ইন্ডাস্ট্রিজ',en:'Meghna Carton Industries',v:2310000,due:2180000,days:96},{bn:'আলিফ প্লাস্টিক',en:'Alif Plastic',v:1760000,due:640000,days:38},{bn:'নিউ ঢাকা প্রিন্টিং প্রেস',en:'New Dhaka Printing Press',v:1420000,due:910000,days:52},{bn:'বসুন্ধরা পলি',en:'Bashundhara Poly',v:1180000,due:0,days:0}],
ageing:[3120000,2860000,1940000,4380000],
invoices:[['INV-2026-1184',0,486500,486500,'paid',52000],['INV-2026-1183',1,628000,300000,'partial',71500],['INV-2026-1182',2,342000,0,'due',38400],['INV-2026-1181',3,215500,215500,'paid',24100],['INV-2026-1180',4,512000,512000,'paid',58900]],
coll:[[0,350000,'m_bank','১০:৪২','10:42 AM'],[2,120000,'m_bkash','০৯:৫৫','09:55 AM'],[3,200000,'m_cheque','০৯:১০','09:10 AM'],[1,85000,'m_cash','০৮:৩০','08:30 AM']],
act:[['bi-receipt',false,'ইনভয়েস INV-2026-1184 তৈরি হয়েছে','Invoice INV-2026-1184 created','১০ মিনিট আগে','10 min ago'],['bi-cash-coin',false,'রহমান প্যাকেজিং থেকে ৳৩,৫০,০০০ আদায়','৳3,50,000 collected from Rahman Packaging','১ ঘণ্টা আগে','1 hr ago'],['bi-truck',true,'শিপমেন্ট SH-0457 (বিওপিপি ফিল্ম) বন্দরে পৌঁছেছে','Shipment SH-0457 (BOPP Film) arrived at port','৩ ঘণ্টা আগে','3 hrs ago'],['bi-box-arrow-in-down',false,'ক্রাফট পেপার ৫,০০০ কেজি স্টকে গ্রহণ','Kraft Paper 5,000 KG received into stock','গতকাল','Yesterday'],['bi-person-check',false,'আজকের হাজিরা সম্পন্ন (২৪ জন উপস্থিত)','Attendance done (24 present)','গতকাল','Yesterday']],
cashBank:{cash:1845000,bank:6230000,payable:8640000},
notifs:[['bi-exclamation-triangle','warn','বিওপিপি ফিল্ম ন্যূনতম স্টকের নিচে','BOPP Film is below minimum stock','৫ মিনিট আগে','5 min ago'],['bi-clock-history','danger','মেঘনা কার্টনের বকেয়া ৯০ দিন পার','Meghna Carton dues are 90+ days overdue','২ ঘণ্টা আগে','2 hrs ago'],['bi-truck','ok','শিপমেন্ট SH-0457 পৌঁছেছে','Shipment SH-0457 has arrived','৩ ঘণ্টা আগে','3 hrs ago']],
users:{admin:{n:{bn:'আসির আহমেদ তৌসিফ',en:'Asir Ahmed Tousif'}},manager:{n:{bn:'তানভীর হোসেন',en:'Tanvir Hossain'}}}};
})();
