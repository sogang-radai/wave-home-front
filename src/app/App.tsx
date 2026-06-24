import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, CalendarDays, Lightbulb, Bot,
  Moon, Heart, Dumbbell, Timer, AlertTriangle,
  Plus, CheckCircle2, Circle, Clock, BrainCircuit,
  Activity, Music, Bell, Settings, User, TrendingUp,
  TrendingDown, ExternalLink, X, Check,
  AlarmClock, Smartphone, Sun, Thermometer, Flame,
  StretchHorizontal, ArrowRight, Play, Pause, SkipForward,
  Volume2, Wind, Coffee, Lamp, Radio, ChevronLeft,
  ChevronRight, Eye, Bed, Zap, Wifi,
  SkipBack, Repeat, Shuffle, Maximize2, Radio as RadarIcon,
  MapPin, Sliders, PlusCircle, Trash2, CheckCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area,
} from "recharts";

/* ─── Types ─── */
type Page = "dashboard" | "weekly" | "insights" | "agents";
type AgentTab = "sleep" | "posture" | "fitness";

interface MusicOverlay { kind: "music"; track: string; artist: string; playing: boolean; }
interface TimerOverlay { kind: "timer"; exercise: string; curSet: number; totalSets: number; reps: number; unit: string; timeLeft: number; totalTime: number; }
type Overlay = MusicOverlay | TimerOverlay | null;

/* ─── Palette ─── */
const W = {
  5:   "rgba(149,217,248,0.05)",
  10:  "rgba(149,217,248,0.10)",
  15:  "rgba(149,217,248,0.15)",
  20:  "rgba(149,217,248,0.20)",
  30:  "rgba(149,217,248,0.30)",
  40:  "rgba(149,217,248,0.40)",
  60:  "rgba(149,217,248,0.60)",
  80:  "rgba(149,217,248,0.80)",
  full:"#95d9f8",
  ink: "#0b1e2d",
  sub: "#5a7a8f",
  bg:  "#f5fafd",
};

/* ─── Mock Data ─── */
const sleepData=[{day:"월",h:6.2},{day:"화",h:7.1},{day:"수",h:5.8},{day:"목",h:7.5},{day:"금",h:6.9},{day:"토",h:8.2},{day:"일",h:7.0}];
const exerciseData=[{d:"6/14",v:1},{d:"6/15",v:0},{d:"6/16",v:2},{d:"6/17",v:1},{d:"6/18",v:0},{d:"6/19",v:3},{d:"6/20",v:2},{d:"6/21",v:1},{d:"6/22",v:0},{d:"6/23",v:2}];
const hrData=[{t:"00",bpm:58},{t:"03",bpm:54},{t:"06",bpm:62},{t:"09",bpm:71},{t:"12",bpm:78},{t:"15",bpm:82},{t:"18",bpm:75},{t:"21",bpm:66}];
const initTasks=[
  {id:1,title:"오전 30분 조깅",day:"월",done:true,cat:"운동"},
  {id:2,title:"자정 전 취침",day:"월",done:true,cat:"수면"},
  {id:3,title:"저녁 스트레칭 10분",day:"화",done:false,cat:"운동"},
  {id:4,title:"카페인 오후 2시 이후 금지",day:"화",done:true,cat:"식습관"},
  {id:5,title:"점심 산책 20분",day:"수",done:false,cat:"운동"},
  {id:6,title:"수분 섭취 2L",day:"수",done:false,cat:"식습관"},
  {id:7,title:"명상 5분",day:"목",done:false,cat:"멘탈"},
  {id:8,title:"오후 10시 화면 차단",day:"금",done:false,cat:"수면"},
];
const products=[
  {title:"나이키 페가수스 41 러닝화",desc:"조깅·러닝 입문자 추천",price:"149,000원",tag:"운동",store:"쿠팡",url:"https://www.coupang.com"},
  {title:"귀리·현미 혼합 잡곡 2kg",desc:"저GI 대사증후군 관리",price:"18,900원",tag:"식습관",store:"네이버",url:"https://shopping.naver.com"},
  {title:"웨이 프로틴 초코 1kg",desc:"운동 후 회복 고단백 보충제",price:"39,800원",tag:"영양",store:"쿠팡",url:"https://www.coupang.com"},
  {title:"나우푸드 멜라토닌 5mg",desc:"수면 리듬 개선 & 입면 단축",price:"22,500원",tag:"수면",store:"네이버",url:"https://shopping.naver.com"},
];
const aiRecs=[
  {title:"수면 전 15분 스트레칭",reason:"평균 입면 32분 → 취침 전 스트레칭으로 단축 가능",cat:"수면",icon:Moon},
  {title:"점심 후 10분 산책",reason:"오후 착석 2.8h 평균 — 짧은 산책이 대사 활성화",cat:"운동",icon:Dumbbell},
  {title:"단백질 보충제 섭취",reason:"운동 후 30분 이내 단백질 20g 섭취 권장",cat:"영양",icon:Zap},
];
const notifList=[
  {id:1,icon:Timer,msg:"착석 1시간 48분 경과 — 스트레칭을 해보세요",time:"방금 전",read:false},
  {id:2,icon:Moon,msg:"오늘 수면 목표까지 30분 부족합니다",time:"오전 7:12",read:false},
  {id:3,icon:AlertTriangle,msg:"거북목 패턴 4회 감지됨",time:"오후 2:35",read:true},
  {id:4,icon:Dumbbell,msg:"오늘 운동 미완료 — 저녁 7시 시작을 권장합니다",time:"오후 6:00",read:true},
  {id:5,icon:Thermometer,msg:"수면 중 실내 온도 자동 조절 작동 (25°C)",time:"어제 23:12",read:true},
];
const tracks=[
  {title:"Eye of the Tiger",artist:"Survivor",dur:"3:45"},
  {title:"Till I Collapse",artist:"Eminem",dur:"4:57"},
  {title:"Lose Yourself",artist:"Eminem",dur:"5:26"},
  {title:"Clair de Lune",artist:"Debussy",dur:"5:02"},
  {title:"Weightless",artist:"Marconi Union",dur:"8:10"},
];

/* ─── Shared UI ─── */
function Toggle({on,onChange}:{on:boolean;onChange:(v:boolean)=>void}) {
  return (
    <button onClick={()=>onChange(!on)} className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
      style={{background:on?W.full:"rgba(0,0,0,0.12)"}}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${on?"left-[22px]":"left-0.5"}`}/>
    </button>
  );
}

function Slider({value,min,max,unit="",onChange}:{value:number;min:number;max:number;unit?:string;onChange:(v:number)=>void}) {
  const pct=((value-min)/(max-min))*100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative h-1.5 rounded-full" style={{background:W[10]}}>
        <div className="absolute h-1.5 rounded-full" style={{width:`${pct}%`,background:W.full}}/>
        <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
      </div>
      <span className="text-sm font-semibold tabular-nums w-14 text-right" style={{color:W.ink}}>{value}{unit}</span>
    </div>
  );
}

function Card({children,className="",pad=true}:{children:React.ReactNode;className?:string;pad?:boolean}) {
  return (
    <div className={`bg-white rounded-2xl border ${pad?"p-5":""} ${className}`}
      style={{borderColor:W[20],boxShadow:`0 1px 8px ${W[10]}`}}>
      {children}
    </div>
  );
}

function Tag({label}:{label:string}) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{background:W[20],color:W.ink}}>
      {label}
    </span>
  );
}

function SHead({title,sub,icon:Icon}:{title:string;sub?:string;icon?:any}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon&&<div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{background:W[15]}}><Icon size={14} style={{color:W.ink}}/></div>}
      <div>
        <p className="text-sm font-bold" style={{color:W.ink}}>{title}</p>
        {sub&&<p className="text-xs" style={{color:W.sub}}>{sub}</p>}
      </div>
    </div>
  );
}

function SRow({icon:Icon,title,desc,children}:{icon:any;title:string;desc?:string;children?:React.ReactNode}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0" style={{borderColor:W[10]}}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:W[10]}}><Icon size={14} style={{color:W.ink}}/></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{color:W.ink}}>{title}</p>
        {desc&&<p className="text-xs" style={{color:W.sub}}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}


/* ═══ MUSIC FULLSCREEN OVERLAY ═══ */
function MusicOverlayView({overlay,onClose,onToggle,onNext,onPrev}:{
  overlay:MusicOverlay;onClose:()=>void;onToggle:()=>void;onNext:()=>void;onPrev:()=>void;
}) {
  const [progress,setProgress]=useState(40);
  const [vol,setVol]=useState(75);

  useEffect(()=>{
    if(!overlay.playing) return;
    const t=setInterval(()=>setProgress(p=>Math.min(100,p+0.05)),300);
    return()=>clearInterval(t);
  },[overlay.playing]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{background:`linear-gradient(160deg, rgba(149,217,248,0.95) 0%, rgba(149,217,248,0.60) 40%, rgba(149,217,248,0.80) 100%)`}}>
      {/* Animated ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute w-96 h-96 rounded-full -top-20 -left-20 ${overlay.playing?"animate-pulse":""}`}
          style={{background:"rgba(149,217,248,0.40)",filter:"blur(80px)"}}/>
        <div className={`absolute w-80 h-80 rounded-full bottom-10 right-0 ${overlay.playing?"animate-pulse":""}`}
          style={{background:"rgba(149,217,248,0.30)",filter:"blur(60px)",animationDelay:"0.8s"}}/>
        <div className="absolute w-64 h-64 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{background:"rgba(255,255,255,0.15)",filter:"blur(40px)"}}/>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors">
          <X size={18} style={{color:W.ink}}/>
        </button>
        <p className="text-sm font-bold" style={{color:W.ink}}>지금 재생 중</p>
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
          <Maximize2 size={16} style={{color:W.ink}}/>
        </div>
      </div>

      {/* Album art with animated rings */}
      <div className="relative flex-1 flex items-center justify-center">
        {/* Pulsing rings */}
        {overlay.playing&&[0,1,2].map(i=>(
          <div key={i} className="absolute rounded-full animate-ping"
            style={{width:`${220+i*60}px`,height:`${220+i*60}px`,
              border:`1.5px solid rgba(149,217,248,${0.4-i*0.1})`,
              animationDuration:`${1.5+i*0.5}s`,animationDelay:`${i*0.3}s`}}/>
        ))}
        {/* Album art circle */}
        <div className="relative w-52 h-52 rounded-full flex items-center justify-center shadow-2xl overflow-hidden"
          style={{background:`linear-gradient(135deg, ${W.full} 0%, rgba(149,217,248,0.5) 100%)`,boxShadow:`0 0 60px rgba(149,217,248,0.6)`}}>
          <div className="absolute inset-0" style={{background:"linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)"}}/>
          <Music size={64} style={{color:"rgba(11,30,45,0.7)"}}/>
          {/* Rotating vinyl effect */}
          {overlay.playing&&(
            <div className="absolute inset-0 rounded-full border-8 border-white/10 animate-spin" style={{animationDuration:"8s"}}/>
          )}
        </div>
      </div>

      {/* Waveform bars */}
      {overlay.playing&&(
        <div className="relative z-10 flex items-end justify-center gap-1 h-12 mx-auto mb-2">
          {Array.from({length:24}).map((_,i)=>{
            const heights=["h-2","h-4","h-7","h-5","h-9","h-6","h-10","h-4","h-8","h-5","h-3","h-7","h-9","h-4","h-6","h-10","h-5","h-8","h-3","h-6","h-9","h-4","h-7","h-5"];
            const delays=["[animation-delay:0ms]","[animation-delay:100ms]","[animation-delay:200ms]","[animation-delay:300ms]","[animation-delay:400ms]","[animation-delay:500ms]","[animation-delay:600ms]","[animation-delay:700ms]","[animation-delay:150ms]","[animation-delay:250ms]","[animation-delay:350ms]","[animation-delay:450ms]","[animation-delay:50ms]","[animation-delay:180ms]","[animation-delay:320ms]","[animation-delay:420ms]","[animation-delay:75ms]","[animation-delay:225ms]","[animation-delay:375ms]","[animation-delay:475ms]","[animation-delay:120ms]","[animation-delay:280ms]","[animation-delay:380ms]","[animation-delay:480ms]"];
            return (
              <div key={i} className={`w-1.5 ${heights[i%heights.length]} rounded-full animate-bounce ${delays[i%delays.length]} transition-all`}
                style={{background:`rgba(11,30,45,${0.3+Math.random()*0.4})`,animationDuration:`${0.6+i%3*0.2}s`}}/>
            );
          })}
        </div>
      )}

      {/* Track info */}
      <div className="relative z-10 px-8 pb-2 text-center">
        <p className="text-2xl font-bold mb-1" style={{color:W.ink}}>{overlay.track}</p>
        <p className="text-sm" style={{color:"rgba(11,30,45,0.65)"}}>{overlay.artist}</p>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-8 pt-4 pb-2">
        <div className="relative h-1.5 rounded-full cursor-pointer" style={{background:"rgba(11,30,45,0.15)"}}>
          <div className="h-1.5 rounded-full transition-all" style={{width:`${progress}%`,background:W.ink}}/>
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 transition-all"
            style={{left:`calc(${progress}% - 8px)`,borderColor:W.ink}}/>
        </div>
        <div className="flex justify-between text-xs mt-2" style={{color:"rgba(11,30,45,0.55)"}}>
          <span>{Math.floor(progress/100*245/60)}:{String(Math.floor(progress/100*245%60)).padStart(2,"0")}</span>
          <span>-{Math.floor((100-progress)/100*245/60)}:{String(Math.floor((100-progress)/100*245%60)).padStart(2,"0")}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 px-8 pb-4">
        <div className="flex items-center justify-between">
          <button className="w-10 h-10 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"><Shuffle size={20} style={{color:W.ink}}/></button>
          <button onClick={onPrev} className="w-12 h-12 flex items-center justify-center"><SkipBack size={28} style={{color:W.ink}}/></button>
          <button onClick={onToggle}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
            style={{background:W.ink}}>
            {overlay.playing?<Pause size={26} style={{color:W.full}}/>:<Play size={26} style={{color:W.full}}/>}
          </button>
          <button onClick={onNext} className="w-12 h-12 flex items-center justify-center"><SkipForward size={28} style={{color:W.ink}}/></button>
          <button className="w-10 h-10 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"><Repeat size={20} style={{color:W.ink}}/></button>
        </div>
      </div>

      {/* Volume */}
      <div className="relative z-10 px-8 pb-8">
        <div className="flex items-center gap-3">
          <Volume2 size={16} style={{color:"rgba(11,30,45,0.5)"}}/>
          <div className="flex-1 relative h-1.5 rounded-full" style={{background:"rgba(11,30,45,0.15)"}}>
            <div className="h-1.5 rounded-full" style={{width:`${vol}%`,background:W.ink}}/>
            <input type="range" min={0} max={100} value={vol} onChange={e=>setVol(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
          </div>
          <Volume2 size={20} style={{color:"rgba(11,30,45,0.5)"}}/>
        </div>
      </div>
    </div>
  );
}

/* ═══ TIMER FULLSCREEN OVERLAY ═══ */
function TimerOverlayView({overlay,onClose}:{overlay:TimerOverlay;onClose:()=>void}) {
  // 오버레이가 자체 타이머 상태를 소유 — 부모 스냅샷에 의존하지 않음
  const [timeLeft, setTimeLeft] = useState(overlay.timeLeft);
  const [playing, setPlaying] = useState(true);
  const tickRef = useRef<ReturnType<typeof setInterval>|null>(null);

  // overlay가 바뀌면(새 운동으로 전환) 리셋
  useEffect(()=>{
    setTimeLeft(overlay.timeLeft);
    setPlaying(true);
  },[overlay.exercise, overlay.curSet]);

  // 실제 카운트다운
  useEffect(()=>{
    if(playing && timeLeft > 0){
      tickRef.current = setInterval(()=>setTimeLeft(p=>p-1), 1000);
    } else {
      if(tickRef.current) clearInterval(tickRef.current);
    }
    return ()=>{ if(tickRef.current) clearInterval(tickRef.current); };
  },[playing, timeLeft]);

  const pct = overlay.totalTime > 0 ? timeLeft / overlay.totalTime : 1;
  const r = 110;
  const circ = 2 * Math.PI * r;
  const fmt = (s:number) =>
    `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-64 top-0"
          style={{background:`linear-gradient(180deg, ${W[20]} 0%, transparent 100%)`}}/>
        <div className="absolute w-full h-48 bottom-0"
          style={{background:`linear-gradient(0deg, ${W[10]} 0%, transparent 100%)`}}/>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{background:W[15]}}>
          <X size={18} style={{color:W.ink}}/>
        </button>
        <p className="text-sm font-bold" style={{color:W.ink}}>운동 타이머</p>
        <div style={{width:40}}/>
      </div>

      {/* Main */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-6 px-8">
        <p className="text-lg font-bold" style={{color:W.sub}}>
          세트 {overlay.curSet} / {overlay.totalSets}
        </p>

        {/* Circular timer */}
        <div className="relative">
          <svg width="260" height="260" className="-rotate-90">
            <circle cx="130" cy="130" r={r} fill="none" stroke={W[15]} strokeWidth="14"/>
            <circle cx="130" cy="130" r={r} fill="none" stroke={W.full} strokeWidth="14"
              strokeDasharray={circ}
              strokeDashoffset={circ*(1-pct)}
              strokeLinecap="round"
              style={{transition:"stroke-dashoffset 1s linear"}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-6xl font-bold font-mono" style={{color:W.ink}}>{fmt(timeLeft)}</p>
            <p className="text-sm mt-1" style={{color:W.sub}}>남은 시간</p>
          </div>
        </div>

        {/* Exercise info */}
        <div className="text-center">
          <p className="text-4xl font-bold mb-1" style={{color:W.ink}}>{overlay.exercise}</p>
          <p className="text-base" style={{color:W.sub}}>{overlay.reps}{overlay.unit}</p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mt-4">
          <button onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-70"
            style={{background:W[15],color:W.ink}}>
            종료
          </button>
          <button onClick={()=>setPlaying(p=>!p)}
            className="px-10 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{background:W.full,color:W.ink}}>
            {playing
              ? <span className="flex items-center gap-2"><Pause size={16}/>일시정지</span>
              : <span className="flex items-center gap-2"><Play size={16}/>계속</span>}
          </button>
        </div>
      </div>

      {/* Set progress dots */}
      <div className="relative z-10 flex justify-center gap-2 pb-12">
        {Array.from({length:overlay.totalSets}).map((_,i)=>(
          <div key={i} className="w-2 h-2 rounded-full transition-all"
            style={{background:i < overlay.curSet-1 ? W[60] : i === overlay.curSet-1 ? W.full : W[20]}}/>
        ))}
      </div>
    </div>
  );
}

/* ═══ SETTINGS MODAL (Radar Management) ═══ */
function SettingsModal({onClose}:{onClose:()=>void}) {
  const [rooms,setRooms]=useState([
    {id:1,name:"침실",active:true,sens:70},
    {id:2,name:"서재",active:true,sens:85},
    {id:3,name:"거실",active:false,sens:60},
  ]);
  const [adding,setAdding]=useState(false);
  const [newRoom,setNewRoom]=useState("");

  const toggleRoom=(id:number)=>setRooms(p=>p.map(r=>r.id===id?{...r,active:!r.active}:r));
  const setSens=(id:number,v:number)=>setRooms(p=>p.map(r=>r.id===id?{...r,sens:v}:r));
  const addRoom=()=>{if(newRoom.trim()){setRooms(p=>[...p,{id:Date.now(),name:newRoom.trim(),active:true,sens:70}]);setNewRoom("");setAdding(false);}};
  const removeRoom=(id:number)=>setRooms(p=>p.filter(r=>r.id!==id));

  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
        style={{border:`1px solid ${W[20]}`}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b" style={{borderColor:W[15]}}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:W[15]}}><RadarIcon size={15} style={{color:W.ink}}/></div>
            <div>
              <p className="text-sm font-bold" style={{color:W.ink}}>레이더 관리</p>
              <p className="text-xs" style={{color:W.sub}}>감지 구역 및 민감도 설정</p>
            </div>
          </div>
          <button onClick={onClose}><X size={16} style={{color:W.sub}}/></button>
        </div>

        {/* Connection status */}
        <div className="mx-5 mt-4 p-3 rounded-xl flex items-center gap-3" style={{background:W[5],border:`1px solid ${W[15]}`}}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{background:W.full}}/>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{color:W.ink}}>레이더 센서 연결됨</p>
            <p className="text-[10px]" style={{color:W.sub}}>WaveHome Radar v2.1 · 마지막 동기화: 2분 전</p>
          </div>
          <Wifi size={14} style={{color:W.full}}/>
        </div>

        {/* Rooms */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{color:W.sub}}>감지 구역</p>
            <button onClick={()=>setAdding(true)} className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity" style={{color:W.ink}}>
              <PlusCircle size={13}/>구역 추가
            </button>
          </div>
          <div className="space-y-3">
            {rooms.map(r=>(
              <div key={r.id} className="rounded-xl p-3 border" style={{borderColor:W[15]}}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:W[10]}}><MapPin size={13} style={{color:W.ink}}/></div>
                  <p className="text-sm font-semibold flex-1" style={{color:W.ink}}>{r.name}</p>
                  <button onClick={()=>removeRoom(r.id)} className="opacity-40 hover:opacity-70 transition-opacity"><Trash2 size={13} style={{color:W.ink}}/></button>
                  <Toggle on={r.active} onChange={()=>toggleRoom(r.id)}/>
                </div>
                {r.active&&(
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{color:W.sub}}>
                      <span>감지 민감도</span><span className="font-semibold" style={{color:W.ink}}>{r.sens}%</span>
                    </div>
                    <Slider value={r.sens} min={20} max={100} unit="%" onChange={v=>setSens(r.id,v)}/>
                  </div>
                )}
              </div>
            ))}
          </div>
          {adding&&(
            <div className="mt-3 flex gap-2">
              <input value={newRoom} onChange={e=>setNewRoom(e.target.value)} placeholder="구역 이름 (예: 안방)"
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={{border:`1.5px solid ${W[30]}`,background:W[5]}}
                onKeyDown={e=>{if(e.key==="Enter") addRoom();}}/>
              <button onClick={addRoom} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{background:W.full,color:W.ink}}>추가</button>
              <button onClick={()=>setAdding(false)}><X size={15} style={{color:W.sub}}/></button>
            </div>
          )}
        </div>

        {/* Global settings */}
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold mb-3 mt-4" style={{color:W.sub}}>전체 설정</p>
          {[{icon:Sliders,title:"자동 민감도 조정",desc:"환경 변화에 따라 자동으로 최적화"},{icon:Bell,title:"긴급 감지 알림",desc:"비정상적 패턴 감지 시 즉시 알림"},{icon:Activity,title:"24시간 모니터링",desc:"수면·기상 시간 없이 연속 감지"}].map((s,i)=>(
            <SRow key={i} icon={s.icon} title={s.title} desc={s.desc}><Toggle on={true} onChange={()=>{}}/></SRow>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ NOTIFICATIONS PANEL ═══ */
function NotificationsPanel({onClose}:{onClose:()=>void}) {
  const [notifs,setNotifs]=useState(notifList);
  const markAll=()=>setNotifs(p=>p.map(n=>({...n,read:true})));
  const unread=notifs.filter(n=>!n.read).length;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-14 right-4 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{border:`1px solid ${W[20]}`}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:W[15]}}>
          <div>
            <p className="text-sm font-bold" style={{color:W.ink}}>알림</p>
            {unread>0&&<p className="text-xs" style={{color:W.sub}}>읽지 않은 알림 {unread}개</p>}
          </div>
          <div className="flex items-center gap-2">
            {unread>0&&<button onClick={markAll} className="flex items-center gap-1 text-xs font-semibold hover:opacity-70" style={{color:W.ink}}><CheckCheck size={12}/>모두 읽음</button>}
            <button onClick={onClose}><X size={14} style={{color:W.sub}}/></button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifs.map(n=>(
            <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-gray-50/50" style={{borderColor:W[5]}}>
              <div className="relative mt-0.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:W[n.read?10:20]}}><n.icon size={13} style={{color:W.ink}}/></div>
                {!n.read&&<div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-400"/>}
              </div>
              <div className="flex-1">
                <p className={`text-xs leading-snug ${n.read?"":"font-semibold"}`} style={{color:W.ink}}>{n.msg}</p>
                <p className="text-[10px] mt-0.5" style={{color:W.sub}}>{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ DASHBOARD ═══ */
function Dashboard() {
  const [exPeriod, setExPeriod] = useState<"week"|"month">("week");

  // SVG donut helper
  const Donut = ({pct, r=38, sw=8, color=W.full, bg=W[10], children}:{pct:number;r?:number;sw?:number;color?:string;bg?:string;children?:React.ReactNode}) => {
    const circ = 2*Math.PI*r;
    const sz = (r+sw)*2+4;
    return (
      <div className="relative inline-flex items-center justify-center" style={{width:sz,height:sz}}>
        <svg width={sz} height={sz} className="-rotate-90" viewBox={`0 0 ${sz} ${sz}`}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={bg} strokeWidth={sw}/>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${circ*pct} ${circ*(1-pct)}`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      </div>
    );
  };

  // Task category colors
  const catColor: Record<string,string> = {운동:W[20],수면:W[15],식습관:W[10],멘탈:W[20]};
  const catIcon: Record<string,any> = {운동:Dumbbell,수면:Moon,식습관:Activity,멘탈:BrainCircuit};

  return (
    <div className="flex flex-col gap-4">

      {/* ── ROW 1: 수면 추세(넓게) + 자세 점수 ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* LEFT — 수면 추세 (확대: col-9) */}
        <Card className="col-span-12 md:col-span-9 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{color:W.sub}}>수면 추세</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{background:W[10],color:W.ink}}>최근 7일</span>
          </div>
          {/* Big number + goal bar */}
          <div className="flex items-end gap-6 mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold" style={{color:W.ink}}>7.0</span>
              <span className="text-xl font-semibold" style={{color:W.sub}}>h</span>
            </div>
            <p className="text-xs mb-1" style={{color:W.sub}}>목표 7.5h 대비 <span style={{color:W.ink,fontWeight:700}}>93%</span></p>
          </div>
          {/* Sleep quality dots */}
          <div className="flex gap-1.5 mb-1">
            {sleepData.map((d,i)=>(
              <div key={i} title={`${d.day} ${d.h}h`} className="flex-1 h-2 rounded-full"
                style={{background: d.h>=7?W.full:d.h>=6?W[40]:W[20]}}/>
            ))}
          </div>
          <p className="text-[10px] mb-3" style={{color:W.sub}}>
            {sleepData.map(d=>`${d.day} ${d.h}h`).join(' · ')}
          </p>
          {/* Trend chart — Y축 스케일 + 점 포함 */}
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart id="db-sleep" data={sleepData} margin={{top:4,right:8,bottom:0,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke={W[10]}/>
                <XAxis dataKey="day" tick={{fontSize:11,fill:W.sub}} axisLine={false} tickLine={false}/>
                <YAxis domain={[4,9]} tick={{fontSize:11,fill:W.sub}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${W[20]}`,boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}} formatter={(v:any)=>[`${v}h`,"수면"]}/>
                <Area type="monotone" dataKey="h" stroke={W.full} strokeWidth={2.5} fill={W[10]} dot={{fill:W.full,r:4,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between pt-2 border-t mt-2" style={{borderColor:W[10]}}>
            <span className="text-[11px]" style={{color:W.sub}}>7일 평균</span>
            <span className="text-sm font-bold" style={{color:W.ink}}>6.8h</span>
          </div>
        </Card>

        {/* RIGHT — 자세 점수 (Sentiment gauge style) */}
        <Card className="col-span-12 md:col-span-3 flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 self-start" style={{color:W.sub}}>자세 점수</p>
          {(() => {
            const score = 68;
            const pct   = score / 100;
            const cx = 100, cy = 72, r = 65;
            // needle: pct=0 → left (cx-r,cy), pct=1 → right (cx+r,cy), pct=0.5 → top
            const ang = Math.PI * (1 - pct);            // π→0 as pct 0→1
            const nx  = cx + r * Math.cos(ang);
            const ny  = cy - r * Math.sin(ang);         // minus: SVG y grows downward
            // sweep=1 draws clockwise on screen = upper semicircle ✓
            // large-arc=0 always (max arc is exactly 180°, never more)
            const bgArc = `M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
            const fgArc = pct <= 0 ? "" : pct >= 1
              ? `M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`
              : `M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${nx.toFixed(2)} ${ny.toFixed(2)}`;
            const status = score > 80 ? "양호!" : score > 60 ? "주의" : "위험";
            return (
              <>
                <svg width="100%" viewBox="0 0 200 78" className="overflow-visible mb-5">
                  {/* Background arc */}
                  <path d={bgArc} fill="none" stroke={W[20]} strokeWidth="11" strokeLinecap="round"/>
                  {/* Foreground arc */}
                  {fgArc && <path d={fgArc} fill="none" stroke={W.full} strokeWidth="11" strokeLinecap="round"/>}
                  {/* Needle dot */}
                  <circle cx={nx.toFixed(2)} cy={ny.toFixed(2)} r="7" fill="white" stroke={W.full} strokeWidth="3"/>

                  {/* Sparkles */}
                  {[{x:50,y:32,s:9},{x:152,y:42,s:7},{x:100,y:6,s:6},{x:66,y:14,s:5},{x:140,y:16,s:5}].map((sp,i)=>(
                    <text key={i} x={sp.x} y={sp.y} fontSize={sp.s} fill={W.full} textAnchor="middle" dominantBaseline="middle" opacity="0.8">✦</text>
                  ))}

                  {/* Face circle */}
                  <circle cx={cx} cy={cy} r="30" fill={W.full}/>
                  {/* Inner face shading */}
                  <circle cx={cx} cy={cy} r="30" fill="rgba(255,255,255,0.15)"/>

                  {/* Eyes — closed happy arcs */}
                  {score > 70 ? (
                    <>
                      <path d={`M ${cx-13} ${cy-8} Q ${cx-9} ${cy-13} ${cx-5} ${cy-8}`} fill="none" stroke={W.ink} strokeWidth="2.5" strokeLinecap="round"/>
                      <path d={`M ${cx+5}  ${cy-8} Q ${cx+9} ${cy-13} ${cx+13} ${cy-8}`} fill="none" stroke={W.ink} strokeWidth="2.5" strokeLinecap="round"/>
                    </>
                  ) : (
                    <>
                      <circle cx={cx-9} cy={cy-8} r="3.5" fill={W.ink}/>
                      <circle cx={cx+9} cy={cy-8} r="3.5" fill={W.ink}/>
                    </>
                  )}

                  {/* Mouth */}
                  {score > 80
                    ? <path d={`M ${cx-11} ${cy+6} Q ${cx} ${cy+17} ${cx+11} ${cy+6}`} fill="none" stroke={W.ink} strokeWidth="2.5" strokeLinecap="round"/>
                    : score > 60
                    ? <path d={`M ${cx-11} ${cy+8} Q ${cx} ${cy+13} ${cx+11} ${cy+8}`} fill="none" stroke={W.ink} strokeWidth="2" strokeLinecap="round"/>
                    : <line x1={cx-11} y1={cy+10} x2={cx+11} y2={cy+10} stroke={W.ink} strokeWidth="2" strokeLinecap="round"/>
                  }
                </svg>

                {/* Status label */}
                <p className="text-xl font-bold mt-8" style={{color:W.full}}>{status}</p>
                <p className="text-xs mt-0.5" style={{color:W.sub}}>
                  자세 점수 <span className="font-bold" style={{color:W.ink}}>{score}점</span> / 100
                </p>
              </>
            );
          })()}

          <p className="text-xs mt-3 font-semibold" style={{color:W.ink}}>
            거북목 감지 오늘 <span style={{color:W.full}}>4회</span>
          </p>
          <p className="text-[10px] mt-0.5" style={{color:W.sub}}>전주 평균 7.3회 대비 개선</p>
          <div className="w-full mt-3 pt-3 border-t" style={{borderColor:W[10]}}>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div><p className="text-xs font-bold" style={{color:W.ink}}>71%</p><p className="text-[10px]" style={{color:W.sub}}>바른 자세</p></div>
              <div><p className="text-xs font-bold" style={{color:W.ink}}>62%</p><p className="text-[10px]" style={{color:W.sub}}>알림 수락</p></div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── ROW 2: 운동횟수+주간계획(좌) + 어젯밤수면+심박수(우) ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* LEFT column — 운동 횟수 위 / 주간 계획 달성 아래 */}
        <div className="col-span-12 md:col-span-7 flex flex-col gap-4">

          {/* 운동 횟수 (주간 계획 달성 위) */}
          <Card className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{color:W.sub}}>운동 횟수</p>
              <div className="flex gap-1">
                {(["week","month"] as const).map(p=>(
                  <button key={p} onClick={()=>setExPeriod(p)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all"
                    style={{background:exPeriod===p?W.full:"transparent",color:exPeriod===p?W.ink:W.sub}}>
                    {p==="week"?"이번 주":"이번 달"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-8 mb-3">
              <div>
                <p className="text-[10px] mb-0.5" style={{color:W.sub}}>{exPeriod==="week"?"이번 주":"이번 달"} 총 운동</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold" style={{color:W.ink}}>{exPeriod==="week"?3:14}</span>
                  <span className="text-lg font-semibold" style={{color:W.sub}}>회</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] mb-0.5" style={{color:W.sub}}>전{exPeriod==="week"?"주":"월"} 대비</p>
                <div className="flex items-baseline gap-1">
                  <TrendingUp size={16} className="self-center" style={{color:W.full}}/>
                  <span className="text-4xl font-bold" style={{color:W.full}}>+{exPeriod==="week"?1:3}</span>
                  <span className="text-lg font-semibold" style={{color:W[60]}}>회</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart id="db-exercise" data={exerciseData} margin={{top:2,right:4,bottom:0,left:-28}}>
                <CartesianGrid strokeDasharray="3 3" stroke={W[10]}/>
                <XAxis dataKey="d" tick={{fontSize:9,fill:W.sub}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:W.sub}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${W[20]}`}} formatter={(v:any)=>[`${v}회`,"운동"]}/>
                <Bar dataKey="v" radius={[3,3,0,0]} shape={(props:any)=>{const{x,y,width,height,index}=props;if(height<=0)return<g/>;return<rect x={x} y={y} width={width} height={height} rx={3} fill={index===9?W.full:W[40]}/>;}}/>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between pt-2 border-t mt-2" style={{borderColor:W[10]}}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background:W.full}}/><span className="text-[10px]" style={{color:W.sub}}>오늘</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background:W[40]}}/><span className="text-[10px]" style={{color:W.sub}}>이전</span></div>
              </div>
              <span className="text-[10px]" style={{color:W.sub}}>목표 주 5회</span>
            </div>
          </Card>

          {/* 주간 계획 달성 (운동 횟수 아래) */}
          <Card>
            <SHead title="주간 계획 달성" sub="8개 중 5개 완료"/>
            <div className="flex gap-5 items-center mb-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="30" fill="none" stroke={W[10]} strokeWidth="8"/>
                  <circle cx="40" cy="40" r="30" fill="none" stroke={W.full} strokeWidth="8"
                    strokeDasharray={`${2*Math.PI*30*0.68} ${2*Math.PI*30*0.32}`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{color:W.ink}}>68%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {[{l:"운동",p:60},{l:"수면",p:75},{l:"식습관",p:50},{l:"멘탈",p:100}].map(b=>(
                  <div key={b.l}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{color:W.sub}}>{b.l}</span>
                      <span className="font-semibold" style={{color:W.ink}}>{b.p}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{background:W[10]}}>
                      <div className="h-1.5 rounded-full" style={{width:`${b.p}%`,background:W.full}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {initTasks.slice(0,6).map(t=>(
                <div key={t.id} className="flex items-center gap-2 text-xs py-1">
                  {t.done
                    ? <CheckCircle2 size={13} className="shrink-0" style={{color:W.full}}/>
                    : <Circle size={13} className="shrink-0" style={{color:W[40]}}/>}
                  <span className={t.done?"line-through":""} style={{color:t.done?W.sub:W.ink}}>{t.title}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>{/* end LEFT column */}

        {/* RIGHT — stacked: 어젯밤 수면 + 안정 심박수 */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-4">

          {/* 어젯밤 수면 + 연속 착석 시간 */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{color:W.sub}}>어젯밤 수면</p>
            <div className="flex items-center gap-4">
              <Donut pct={0.933} r={48} sw={11} color={W.full}>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold" style={{color:W.ink}}>7.0</span>
                  <span className="text-[10px]" style={{color:W.sub}}>h</span>
                </div>
              </Donut>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] mb-0.5" style={{color:W.sub}}>달성</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold" style={{color:W.ink}}>7.0</span>
                      <span className="text-xs" style={{color:W.sub}}>h</span>
                    </div>
                    <p className="text-[10px]" style={{color:W.sub}}>오늘 달성량</p>
                  </div>
                  <div>
                    <p className="text-[10px] mb-0.5" style={{color:W.sub}}>목표</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold" style={{color:W.sub}}>7.5</span>
                      <span className="text-xs" style={{color:W.sub}}>h</span>
                    </div>
                    <p className="text-[10px]" style={{color:W.sub}}>일일 목표</p>
                  </div>
                </div>
                <div className="pt-2 border-t" style={{borderColor:W[10]}}>
                  <div className="flex justify-between text-[10px]">
                    <span style={{color:W.sub}}>입면 시간</span>
                    <span className="font-semibold" style={{color:W.ink}}>23:42</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-0.5">
                    <span style={{color:W.sub}}>기상 시간</span>
                    <span className="font-semibold" style={{color:W.ink}}>06:42</span>
                  </div>
                </div>
              </div>
            </div>
            {/* 연속 착석 시간 — 바로 아래 붙임 */}
            <div className="mt-4 pt-4 border-t" style={{borderColor:W[10]}}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{color:W.sub}}>연속 착석 시간</p>
                <Timer size={13} style={{color:W.sub}}/>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold" style={{color:W.full}}>1</span>
                <span className="text-base font-semibold" style={{color:W.full}}>h</span>
                <span className="text-2xl font-bold" style={{color:W.full}}>48</span>
                <span className="text-base font-semibold" style={{color:W.full}}>m</span>
                <span className="text-xs ml-2" style={{color:W.sub}}>현재 세션 · 권장 최대 90분</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{background:W[10]}}>
                <div className="h-1.5 rounded-full transition-all" style={{width:"80%",background:W.full}}/>
              </div>
              <div className="flex justify-between text-[10px] mt-1" style={{color:W.sub}}>
                <span>0분</span><span>현재 108분</span><span>최대 90분 초과</span>
              </div>
            </div>
          </Card>

          {/* 안정 심박수 (Phone Leads) */}
          <Card>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold" style={{color:W.ink}}>심박수</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{background:W[10]}}>
                <Heart size={10} style={{color:W.ink}}/>
                <span className="text-xs font-bold" style={{color:W.ink}}>62 bpm</span>
              </div>
            </div>
            <p className="text-xs mb-3" style={{color:W.sub}}>오늘 시간대별</p>
            <ResponsiveContainer width="100%" height={115}>
              <LineChart id="db-heart" data={hrData} margin={{top:4,right:4,bottom:0,left:-28}}>
                <CartesianGrid strokeDasharray="3 3" stroke={W[10]}/>
                <XAxis dataKey="t" tick={{fontSize:9,fill:W.sub}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}시`}/>
                <YAxis domain={[45,95]} tick={{fontSize:9,fill:W.sub}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${W[20]}`,boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}} formatter={(v:any)=>[`${v} bpm`,"심박"]}/>
                <Line type="monotone" dataKey="bpm" stroke={W.full} strokeWidth={2.5} dot={{fill:W.full,r:3,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-2 mt-3">
              {[{l:"최저",v:"54"},{l:"평균",v:"69"},{l:"최고",v:"82"}].map(s=>(
                <div key={s.l} className="flex-1 text-center rounded-xl py-1.5" style={{background:W[5]}}>
                  <p className="text-sm font-bold" style={{color:W.ink}}>{s.v}</p>
                  <p className="text-[10px]" style={{color:W.sub}}>{s.l}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── ROW 3: 건강 알림 (전체 폭) ── */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12">
          <p className="text-sm font-semibold uppercase tracking-wide mb-4" style={{color:W.sub}}>오늘의 건강 알림</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {icon:Timer,      msg:"착석 1시간 48분 경과 — 스트레칭을 해보세요", time:"방금 전"},
              {icon:Moon,       msg:"오늘 수면 목표까지 30분 부족합니다",           time:"오전 7:12"},
              {icon:AlertTriangle,msg:"거북목 패턴 4회 감지됨",                    time:"오후 2:35"},
              {icon:Dumbbell,   msg:"운동 미완료 — 저녁 7시 시작을 권장합니다",     time:"오후 6:00"},
            ].map((a,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background:W[5]}}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:W[15]}}>
                  <a.icon size={15} style={{color:W.ink}}/>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-snug font-medium" style={{color:W.ink}}>{a.msg}</p>
                  <p className="text-xs mt-1" style={{color:W.sub}}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══ WEEKLY PLAN ═══ */
function WeeklyPlan() {
  const [tasks,setTasks]=useState(initTasks);
  const [modal,setModal]=useState(false);
  const [newTask,setNewTask]=useState("");
  // 날짜 포함 요일 데이터 (2026년 6월 23일~29일)
  const days=[
    {day:"월",date:"23"},
    {day:"화",date:"24"},
    {day:"수",date:"25"},
    {day:"목",date:"26"},
    {day:"금",date:"27"},
    {day:"토",date:"28"},
    {day:"일",date:"29"},
  ];
  const today="월";
  const toggle=(id:number)=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const add=(title:string)=>setTasks(p=>[...p,{id:Date.now(),title,day:today,done:false,cat:"운동"}]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-lg font-bold" style={{color:W.ink}}>주간 건강 계획</h2><p className="text-xs" style={{color:W.sub}}>2026년 6월 23일 ~ 6월 29일</p></div>
        <button onClick={()=>setModal(true)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80" style={{background:W.full,color:W.ink}}><Plus size={14}/>계획 추가</button>
      </div>
      <Card pad={false} className="overflow-hidden">
        <div className="grid grid-cols-8 border-b" style={{borderColor:W[10]}}>
          <div className="p-3 text-xs font-semibold" style={{color:W.sub}}>구분</div>
          {days.map(({day:d,date})=>(
            <div key={d} className="py-2 px-1 text-center" style={{background:d===today?W[5]:undefined}}>
              <p className="text-[10px] font-medium" style={{color:d===today?W.full:W.sub}}>{d}</p>
              <p className="text-sm font-bold mt-0.5" style={{color:d===today?W.ink:W.sub}}>{date}</p>
              {d===today&&<div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{background:W.full}}/>}
            </div>
          ))}
        </div>
        {["운동","수면","식습관","멘탈"].map(cat=>(
          <div key={cat} className="grid grid-cols-8 border-b last:border-b-0" style={{borderColor:W[5]}}>
            <div className="p-2 flex items-center"><Tag label={cat}/></div>
            {days.map(({day:d})=>{const dt=tasks.filter(t=>t.day===d&&t.cat===cat);return(
              <div key={d} className="p-1.5 min-h-[52px]" style={{background:d===today?W[5]:undefined}}>
                {dt.map(t=>(
                  <button key={t.id} onClick={()=>toggle(t.id)} className="w-full text-left text-[10px] px-1.5 py-1 rounded-lg mb-1 leading-snug transition-all"
                    style={{background:t.done?W[20]:W[10],color:t.done?W.ink:W.ink,opacity:t.done?0.6:1,textDecoration:t.done?"line-through":"none"}}>{t.title}</button>
                ))}
              </div>
            );})}
          </div>
        ))}
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <SHead title="오늘의 Todo" sub={`${tasks.filter(t=>t.done).length}/${tasks.length} 완료`}/>
          <div className="space-y-1">
            {tasks.map(t=>(
              <button key={t.id} onClick={()=>toggle(t.id)} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:opacity-80" style={{background:W[5]}}>
                {t.done?<CheckCircle2 size={15} className="shrink-0" style={{color:W.full}}/>:<Circle size={15} className="shrink-0" style={{color:W[40]}}/>}
                <span className={`flex-1 text-sm ${t.done?"line-through":""}`} style={{color:t.done?W.sub:W.ink}}>{t.title}</span>
                <Tag label={t.cat}/>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <SHead title="AI 맞춤 추천 계획" sub="데이터 기반 개인화 제안" icon={BrainCircuit}/>
          <div className="space-y-3">
            {aiRecs.map((r,i)=>(
              <div key={i} className="rounded-xl p-3 border" style={{borderColor:W[15],background:W[5]}}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:W[15]}}><r.icon size={14} style={{color:W.ink}}/></div>
                  <div className="flex-1"><p className="text-sm font-semibold" style={{color:W.ink}}>{r.title}</p><p className="text-xs leading-relaxed mt-0.5" style={{color:W.sub}}>{r.reason}</p></div>
                  <button onClick={()=>add(r.title)} className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80" style={{background:W.full,color:W.ink}}><Plus size={11}/></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <p className="text-xl font-bold mb-4" style={{color:W.ink}}>이런 것은 어떠세요?</p>
        {/* 가로 스와이프 */}
        <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch"}}>
          {products.map((p,i)=>(
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
              className="rounded-xl p-4 border flex flex-col gap-2 transition-all hover:shadow-sm group flex-shrink-0"
              style={{borderColor:W[15],width:"220px",scrollSnapAlign:"start"}}>
              <div className="flex items-center justify-between"><Tag label={p.tag}/><span className="text-[10px]" style={{color:W.sub}}>{p.store}</span></div>
              <p className="text-sm font-semibold group-hover:opacity-70 transition-opacity leading-snug" style={{color:W.ink}}>{p.title}</p>
              <p className="text-xs leading-relaxed" style={{color:W.sub}}>{p.desc}</p>
              <div className="flex items-center justify-between mt-auto pt-1"><span className="text-sm font-bold" style={{color:W.ink}}>{p.price}</span><ExternalLink size={12} style={{color:W.sub}}/></div>
            </a>
          ))}
        </div>
      </Card>
      {modal&&(
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={()=>setModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl" style={{border:`1px solid ${W[20]}`}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><p className="text-sm font-bold" style={{color:W.ink}}>새 계획 추가</p><button onClick={()=>setModal(false)}><X size={15} style={{color:W.sub}}/></button></div>
            <input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="계획 내용을 입력하세요" className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{border:`1.5px solid ${W[30]}`,background:W[5]}} onKeyDown={e=>{if(e.key==="Enter"&&newTask.trim()){add(newTask.trim());setNewTask("");setModal(false);}}}/>
            <button onClick={()=>{if(newTask.trim()){add(newTask.trim());setNewTask("");setModal(false);}}} className="w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{background:W.full,color:W.ink}}>추가</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ INSIGHTS ═══ */
const reports=[
  {agent:"수면 Agent",icon:Moon,summary:"지난 7일 평균 수면 6시간 56분. 목표 대비 4분 부족합니다.",items:["평일 기상 편차: 최대 48분","주말 기상 08:42 — 평일 대비 1시간 32분 늦음","야간 스마트폰 감지: 주 4회 평균 22분","에어컨 자동 조절로 수면 중 25°C 유지"],action:"취침 시간 23:30 고정 알람 설정",features:[{icon:Thermometer,title:"에어컨 자동 조절",on:true},{icon:Lamp,title:"입면 조명 조절",on:true},{icon:AlarmClock,title:"단계별 기상 알람",on:true},{icon:Smartphone,title:"야간 도파민 차단",on:true},{icon:Coffee,title:"카페인 관리",on:false}]},
  {agent:"자세 교정 Agent",icon:StretchHorizontal,summary:"오늘 책상 체류 평소보다 2시간 길었습니다. 자세 교정 알림 9회 발송.",items:["연속 착석 최장: 3시간 12분","거북목 패턴: 일 평균 7.3회","기지개 수락률: 62%","바른 자세 유지: 71% (전주 +8%)"],action:"매 45분마다 기지개 알림 유지",features:[{icon:AlertTriangle,title:"자세 무너짐 알림",on:true},{icon:StretchHorizontal,title:"기지개 권고",on:true},{icon:Timer,title:"연속 착석 경고",on:true}]},
  {agent:"피트니스 Agent",icon:Dumbbell,summary:"이번 주 운동 3회 완료. 개인화 목표 대비 75% 달성.",items:["총 운동 시간: 95분","권장 강도 대비: 82%","최적 시간대: 오전 7~8시 또는 오후 6~7시","운동 중 에어컨 3회 작동, 평균 22°C 유지"],action:"내일 오전 7시 조깅 30분 예약",features:[{icon:Thermometer,title:"운동 중 에어컨 제어",on:true},{icon:Music,title:"운동 음악 재생",on:true},{icon:Timer,title:"맞춤 운동 타이머",on:true}]},
];

function Insights() {
  const [reportIdx, setReportIdx] = useState(0);
  const r = reports[reportIdx];
  const prev = () => setReportIdx(i => (i - 1 + reports.length) % reports.length);
  const next = () => setReportIdx(i => (i + 1) % reports.length);

  return (
    <div className="flex flex-col gap-5">
      {/* 점수 카드 3개 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[{l:"수면 점수",v:82,desc:"전주 대비 +6점",icon:Moon,idx:0},{l:"활동 점수",v:71,desc:"운동 3회 완료",icon:Dumbbell,idx:2},{l:"자세 점수",v:68,desc:"교정 알림 수락 62%",icon:StretchHorizontal,idx:1}].map(s=>(
          <button key={s.l} onClick={()=>setReportIdx(s.idx)}
            className="text-left transition-all hover:opacity-90"
            style={{borderRadius:"1rem",outline:reportIdx===s.idx?`2px solid ${W.full}`:"none"}}>
            <Card className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke={W[10]} strokeWidth="6"/>
                  <circle cx="32" cy="32" r="24" fill="none" stroke={W.full} strokeWidth="6"
                    strokeDasharray={`${2*Math.PI*24*(s.v/100)} ${2*Math.PI*24}`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{color:W.ink}}>{s.v}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <s.icon size={13} style={{color:W.ink}}/>
                  <p className="text-sm font-bold" style={{color:W.ink}}>{s.l}</p>
                </div>
                <p className="text-xs" style={{color:W.sub}}>{s.desc}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {/* 분석 리포트 — 큰 단일 카드 + 좌우 화살표 */}
      <Card>
        {/* 네비게이션 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prev}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{background:W[10]}}>
            <ChevronLeft size={20} style={{color:W.ink}}/>
          </button>

          {/* Agent 탭 인디케이터 */}
          <div className="flex items-center gap-3">
            {reports.map((rep, i) => (
              <button key={i} onClick={() => setReportIdx(i)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{background: i === reportIdx ? W.full : W[10], color: W.ink}}>
                <rep.icon size={14}/>
                {i === reportIdx && <span>{rep.agent}</span>}
              </button>
            ))}
          </div>

          <button onClick={next}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{background:W[10]}}>
            <ChevronRight size={20} style={{color:W.ink}}/>
          </button>
        </div>

        {/* 리포트 본문 */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{background:W[15]}}>
            <r.icon size={26} style={{color:W.ink}}/>
          </div>
          <div>
            <p className="text-xl font-bold mb-1" style={{color:W.ink}}>{r.agent} 분석 리포트</p>
            <p className="text-sm leading-relaxed" style={{color:W.sub}}>{r.summary}</p>
          </div>
        </div>

        {/* 분석 항목 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {r.items.map((item,j)=>(
            <div key={j} className="flex items-start gap-3 rounded-2xl p-4" style={{background:W[5],border:`1px solid ${W[10]}`}}>
              <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{background:W.full}}/>
              <p className="text-sm leading-relaxed" style={{color:W.ink}}>{item}</p>
            </div>
          ))}
        </div>

        {/* 활성 기능 배지 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {r.features.map((f,j)=>(
            <div key={j} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{background:f.on?W[15]:W[5],color:f.on?W.ink:W.sub}}>
              <f.icon size={12}/>
              {f.title}
              {f.on
                ? <Check size={11} style={{color:W.full}}/>
                : <X size={11} style={{color:W.sub}}/>}
            </div>
          ))}
        </div>

        {/* 권장 액션 */}
        <div className="flex items-center justify-between rounded-2xl px-5 py-4"
          style={{background:W[15],border:`1.5px solid ${W[30]}`}}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:W.full}}>
              <Check size={13} style={{color:W.ink}}/>
            </div>
            <p className="text-sm font-bold" style={{color:W.ink}}>권장 액션</p>
          </div>
          <p className="text-sm font-medium" style={{color:W.ink}}>{r.action}</p>
          <button className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
            style={{background:W.full,color:W.ink}}>
            실행 <ArrowRight size={13}/>
          </button>
        </div>

        {/* 페이지 인디케이터 점 */}
        <div className="flex justify-center gap-2 mt-5">
          {reports.map((_,i)=>(
            <button key={i} onClick={()=>setReportIdx(i)}
              className="rounded-full transition-all"
              style={{width: i===reportIdx?20:8, height:8,
                background: i===reportIdx?W.full:W[20]}}/>
          ))}
        </div>
      </Card>
      <Card>
        <SHead title="생활 리듬 분석" icon={Activity}/>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold mb-3" style={{color:W.sub}}>평일 / 주말 기상·취침</p>
            <div className="space-y-3">
              {[{l:"평일 기상",t:"07:18",p:65},{l:"주말 기상",t:"08:42",p:85},{l:"평일 취침",t:"23:42",p:70},{l:"주말 취침",t:"01:15+1",p:90}].map(s=>(
                <div key={s.l}>
                  <div className="flex justify-between text-xs mb-1"><span style={{color:W.sub}}>{s.l}</span><span className="font-semibold" style={{color:W.ink}}>{s.t}</span></div>
                  <div className="h-1.5 rounded-full" style={{background:W[10]}}><div className="h-1.5 rounded-full" style={{width:`${s.p}%`,background:W.full}}/></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-3" style={{color:W.sub}}>재실 및 활동 패턴</p>
            <div className="space-y-2">
              {[{t:"07:00~09:00",s:"기상 / 아침 루틴",icon:Sun},{t:"09:00~12:00",s:"집중 업무",icon:Activity},{t:"14:00~18:00",s:"연속 착석 (고위험)",icon:Timer},{t:"19:00~20:00",s:"운동 최적 시간대",icon:Dumbbell},{t:"22:00~23:30",s:"취침 준비",icon:Moon}].map((item,i)=>(
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{borderColor:W[5]}}><item.icon size={12} style={{color:W.ink}}/><span className="text-[10px] w-28 shrink-0 font-mono" style={{color:W.sub}}>{item.t}</span><span className="text-xs" style={{color:W.ink}}>{item.s}</span></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══ SLEEP AGENT ═══ */
function SleepAgent({onPlayMusic}:{onPlayMusic:(t:string,a:string)=>void}) {
  const [acTemp,setAcTemp]=useState(25);
  const [lightAuto,setLightAuto]=useState(true);
  const [dimStart,setDimStart]=useState(30);
  const [finalBright,setFinalBright]=useState(10);
  const [s1,setS1]=useState(true);
  const [s2,setS2]=useState(true);
  const [s3,setS3]=useState(true);
  const [bedtime,setBedtime]=useState("23:30");
  const [wakeTime,setWakeTime]=useState("07:00");
  const [caffeineOn,setCaffeineOn]=useState(true);
  const [caffeineCut,setCaffeineCut]=useState("14:00");
  const [caffLog,setCaffLog]=useState([80,120]);
  const [dopamine,setDopamine]=useState(true);
  const [dopSens,setDopSens]=useState(70);
  const [musicOn,setMusicOn]=useState(false);
  const total=caffLog.reduce((a,b)=>a+b,0);

  const handleMusicToggle=()=>{
    const next=!musicOn;
    setMusicOn(next);
    if(next) onPlayMusic("Clair de Lune","Debussy");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 flex items-center gap-4 border" style={{background:W[5],borderColor:W[20]}}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:W.full}}><Moon size={18} style={{color:W.ink}}/></div>
        <div className="flex-1"><p className="text-sm font-bold" style={{color:W.ink}}>수면 Agent 활성 중</p><p className="text-xs" style={{color:W.sub}}>레이더 센서 연결됨 · 웨어러블 기기 불필요</p></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full animate-pulse" style={{background:W.full}}/><span className="text-xs font-semibold" style={{color:W.full}}>실시간 감지</span></div>
      </div>
      <Card>
        <SHead title="오늘 밤 수면 계획" icon={Bed}/>
        <div className="grid grid-cols-2 gap-3">
          {[{l:"취침 시간",v:bedtime,set:setBedtime,icon:Moon},{l:"기상 시간",v:wakeTime,set:setWakeTime,icon:Sun}].map(f=>(
            <div key={f.l}><p className="text-xs mb-1.5 flex items-center gap-1" style={{color:W.sub}}><f.icon size={10}/>{f.l}</p><input type="time" value={f.v} onChange={e=>f.set(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm font-bold outline-none" style={{border:`1.5px solid ${W[20]}`,background:W[5],color:W.ink}}/></div>
          ))}
        </div>
        <div className="mt-3 rounded-xl p-3 flex items-center gap-2" style={{background:W[5]}}><Clock size={12} style={{color:W.ink}}/><p className="text-xs" style={{color:W.ink}}>예상 수면 시간: <strong>7시간 30분</strong></p></div>
      </Card>
      <Card>
        <SHead title="에어컨 자동 온도 조절" icon={Thermometer} sub="수면 단계별 자동 제어"/>
        <SRow icon={Wind} title="자동 온도 조절" desc="수면 단계에 따라 최적 온도 유지"><Toggle on={true} onChange={()=>{}}/></SRow>
        <div className="mt-3"><div className="flex justify-between text-xs mb-2"><span style={{color:W.sub}}>목표 온도</span><span className="font-bold" style={{color:W.ink}}>{acTemp}°C</span></div><Slider value={acTemp} min={20} max={28} unit="°C" onChange={setAcTemp}/>
          <div className="mt-3 grid grid-cols-3 gap-2">{[{l:"입면 전",t:acTemp+1},{l:"수면 중",t:acTemp},{l:"기상 전",t:acTemp+2}].map(s=>(
            <div key={s.l} className="rounded-xl p-2.5 text-center" style={{background:W[5]}}><p className="text-[10px] mb-0.5" style={{color:W.sub}}>{s.l}</p><p className="text-base font-bold" style={{color:W.ink}}>{s.t}°C</p></div>
          ))}</div>
        </div>
      </Card>
      <Card>
        <SHead title="입면 조명 자동 조절" icon={Lamp} sub="취침 전 조명 단계별 감소"/>
        <SRow icon={Lamp} title="조명 자동 조절" desc="취침 전 조명을 점진적으로 어둡게"><Toggle on={lightAuto} onChange={setLightAuto}/></SRow>
        {lightAuto&&<div className="mt-3 space-y-3">
          <div><div className="flex justify-between text-xs mb-2"><span style={{color:W.sub}}>조절 시작 (취침 N분 전)</span><span className="font-bold" style={{color:W.ink}}>{dimStart}분 전</span></div><Slider value={dimStart} min={10} max={60} unit="분" onChange={setDimStart}/></div>
          <div><div className="flex justify-between text-xs mb-2"><span style={{color:W.sub}}>최종 밝기</span><span className="font-bold" style={{color:W.ink}}>{finalBright}%</span></div><Slider value={finalBright} min={0} max={30} unit="%" onChange={setFinalBright}/></div>
          <div className="rounded-xl p-3" style={{background:W[5]}}>
            <p className="text-[10px] mb-2" style={{color:W.sub}}>조명 타임라인</p>
            <div className="flex items-end gap-1 h-10">{[100,80,60,40,20,finalBright].map((b,i)=><div key={i} className="flex-1 rounded-t-sm" style={{height:`${b}%`,background:W.full,opacity:0.3+b/200}}/>)}</div>
            <div className="flex justify-between text-[9px] mt-1" style={{color:W.sub}}><span>현재</span><span>취침 -{dimStart}분</span><span>취침</span></div>
          </div>
        </div>}
      </Card>
      <Card>
        <SHead title="단계별 기상 알람" icon={AlarmClock} sub={`기상 시간: ${wakeTime}`}/>
        {[{stage:"1단계",label:"조명 서서히 밝히기",time:"기상 30분 전",on:s1,set:setS1,icon:Sun},{stage:"2단계",label:"수면 음악 / 라디오 재생",time:"기상 15분 전",on:s2,set:setS2,icon:Music},{stage:"3단계",label:"TV 켜기 / 알람 울리기",time:"기상 시간",on:s3,set:setS3,icon:Radio}].map(s=>(
          <SRow key={s.stage} icon={s.icon} title={`${s.stage} · ${s.label}`} desc={s.time}><Toggle on={s.on} onChange={s.set}/></SRow>
        ))}
      </Card>
      <Card>
        <SHead title="카페인 관리" icon={Coffee} sub={`오늘 섭취: ${total}mg / 제한 200mg`}/>
        <SRow icon={Bell} title="카페인 알림" desc={`${caffeineCut} 이후 섭취 억제`}><Toggle on={caffeineOn} onChange={setCaffeineOn}/></SRow>
        {caffeineOn&&<><div className="mt-3 mb-3"><input type="time" value={caffeineCut} onChange={e=>setCaffeineCut(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{border:`1.5px solid ${W[20]}`,background:W[5],color:W.ink}}/></div>
          <div className="h-2 rounded-full mb-3" style={{background:W[10]}}><div className="h-2 rounded-full transition-all" style={{width:`${Math.min(100,(total/200)*100)}%`,background:total>180?W[60]:W.full}}/></div>
          <div className="flex gap-2">
            {[80,40,120].map((mg,i)=><div key={i} className="flex-1 rounded-xl p-2 text-center" style={{background:W[5]}}><p className="text-xs font-bold" style={{color:W.ink}}>{mg}mg</p><p className="text-[10px]" style={{color:W.sub}}>{["아메리카노","녹차","에너지드링크"][i]}</p></div>)}
            <button onClick={()=>setCaffLog(p=>[...p,80])} className="flex-1 rounded-xl p-2 text-center border-2 border-dashed hover:opacity-70 transition-opacity" style={{borderColor:W[30]}}><Plus size={14} className="mx-auto" style={{color:W.ink}}/><p className="text-[10px]" style={{color:W.sub}}>추가</p></button>
          </div></>}
      </Card>
      <Card>
        <SHead title="야간 도파민 패턴 차단" icon={Smartphone} sub="레이더로 스마트폰 사용 감지"/>
        <SRow icon={Eye} title="야간 스마트폰 감지" desc="감지 시 클래식 수면 음악 자동 재생"><Toggle on={dopamine} onChange={setDopamine}/></SRow>
        {dopamine&&<div className="mt-3 space-y-3">
          <div><div className="flex justify-between text-xs mb-2"><span style={{color:W.sub}}>감지 민감도</span><span className="font-bold" style={{color:W.ink}}>{dopSens}%</span></div><Slider value={dopSens} min={30} max={100} unit="%" onChange={setDopSens}/></div>
          <div className="rounded-xl p-3 flex items-center gap-3" style={{background:W[5],border:`1px solid ${W[15]}`}}>
            <Music size={14} style={{color:W.ink}}/>
            <div className="flex-1"><p className="text-xs font-semibold" style={{color:W.ink}}>Clair de Lune — Debussy</p><p className="text-[10px]" style={{color:W.sub}}>클래식 수면 음악</p></div>
            <button onClick={handleMusicToggle} className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:musicOn?W.full:W[20],color:W.ink}}>{musicOn?<Pause size={12}/>:<Play size={12}/>}</button>
          </div>
          <div className="rounded-xl p-3" style={{background:W[5]}}><p className="text-[10px]" style={{color:W.sub}}>마지막 감지</p><p className="text-xs font-semibold mt-0.5" style={{color:W.ink}}>오늘 22:47 · 스마트폰 감지 → 음악 재생됨</p></div>
        </div>}
      </Card>
    </div>
  );
}

/* ═══ POSTURE AGENT ═══ */
function PostureAgent() {
  const [alertOn,setAlertOn]=useState(true);
  const [stretchOn,setStretchOn]=useState(true);
  const [interval,setIntervalVal]=useState(45);
  const [maxSit,setMaxSit]=useState(90);
  const [sens,setSens]=useState(65);
  const [timeLeft,setTimeLeft]=useState(22*60);
  useEffect(()=>{const t=setInterval(()=>setTimeLeft(p=>Math.max(0,p-1)),1000);return()=>clearInterval(t);},[]);
  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const sessions=[{r:"09:00–10:15",sc:92,l:"좋음"},{r:"10:30–12:00",sc:71,l:"주의"},{r:"13:30–15:00",sc:68,l:"주의"},{r:"15:10–18:22",sc:45,l:"위험"}];
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-5 border" style={{background:W[5],borderColor:W[20]}}>
        <div className="flex items-center justify-between mb-4"><div><p className="text-sm font-bold" style={{color:W.ink}}>실시간 자세 상태</p><p className="text-xs" style={{color:W.sub}}>레이더 센서 기반 감지</p></div><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full animate-pulse" style={{background:W.full}}/><span className="text-xs font-bold" style={{color:W.ink}}>경고</span></div></div>
        <div className="grid grid-cols-3 gap-3">{[{l:"현재 자세",v:"경고"},{l:"착석 지속",v:"1h 48m"},{l:"자세 점수",v:"68/100"}].map(s=>(
          <div key={s.l} className="rounded-xl p-3 text-center bg-white"><p className="text-xs mb-0.5" style={{color:W.sub}}>{s.l}</p><p className="text-sm font-bold" style={{color:W.ink}}>{s.v}</p></div>
        ))}</div>
      </div>
      <Card>
        <SHead title="기지개 타이머" icon={StretchHorizontal}/>
        <div className="flex items-center justify-center py-4">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112"><circle cx="56" cy="56" r="48" fill="none" stroke={W[10]} strokeWidth="8"/><circle cx="56" cy="56" r="48" fill="none" stroke={W.full} strokeWidth="8" strokeDasharray={`${2*Math.PI*48*(timeLeft/(interval*60))} ${2*Math.PI*48}`} strokeLinecap="round"/></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-xl font-bold font-mono" style={{color:W.ink}}>{fmt(timeLeft)}</p><p className="text-[9px]" style={{color:W.sub}}>다음 기지개까지</p></div>
          </div>
        </div>
        <SRow icon={Timer} title="기지개 알림 간격" desc="장시간 착석 시 스트레칭 제안"><Toggle on={stretchOn} onChange={setStretchOn}/></SRow>
        {stretchOn&&<div className="mt-3"><div className="flex justify-between text-xs mb-2"><span style={{color:W.sub}}>알림 간격</span><span className="font-bold" style={{color:W.ink}}>{interval}분</span></div><Slider value={interval} min={20} max={90} unit="분" onChange={setIntervalVal}/></div>}
      </Card>
      <Card>
        <SHead title="자세 교정 설정" icon={Bell}/>
        <SRow icon={AlertTriangle} title="자세 무너짐 알림" desc="거북목·굽은 등 패턴 감지 즉시 알림"><Toggle on={alertOn} onChange={setAlertOn}/></SRow>
        {alertOn&&<div className="mt-3"><div className="flex justify-between text-xs mb-2"><span style={{color:W.sub}}>감지 민감도</span><span className="font-bold" style={{color:W.ink}}>{sens}%</span></div><Slider value={sens} min={30} max={100} unit="%" onChange={setSens}/></div>}
        <SRow icon={Timer} title="연속 착석 경고" desc={`${maxSit}분 이상 착석 시 강력 알림`}><span className="text-xs font-bold" style={{color:W.ink}}>{maxSit}분</span></SRow>
        <div className="mt-2"><Slider value={maxSit} min={30} max={180} unit="분" onChange={setMaxSit}/></div>
      </Card>
      <Card>
        <SHead title="오늘 자세 세션" sub="시간대별 자세 품질"/>
        <div className="space-y-2">{sessions.map((s,i)=>(
          <div key={i} className="flex items-center gap-3">
            <span className="text-[10px] font-mono w-28 shrink-0" style={{color:W.sub}}>{s.r}</span>
            <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{background:W[5]}}><div className="h-full rounded-lg transition-all" style={{width:`${s.sc}%`,background:s.sc>80?"#34D399":s.sc>60?"#F59E0B":"#EF4444",opacity:0.7}}/></div>
            <span className="text-xs font-bold w-8 shrink-0" style={{color:W.ink}}>{s.sc}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${s.sc>80?"bg-emerald-100 text-emerald-700":s.sc>60?"bg-amber-100 text-amber-700":"bg-red-100 text-red-600"}`}>{s.l}</span>
          </div>
        ))}</div>
      </Card>
    </div>
  );
}

/* ═══ FITNESS AGENT ═══ */
const initExercises=[
  {name:"스쿼트",sets:3,reps:20,rest:60,done:true,unit:"회"},
  {name:"푸시업",sets:3,reps:15,rest:60,done:true,unit:"회"},
  {name:"플랭크",sets:3,reps:45,rest:45,done:false,unit:"초"},
  {name:"런지",sets:2,reps:12,rest:60,done:false,unit:"회"},
  {name:"버피",sets:2,reps:10,rest:90,done:false,unit:"회"},
];

function FitnessAgent({onPlayMusic,onOpenTimer}:{onPlayMusic:(t:string,a:string)=>void;onOpenTimer:(o:TimerOverlay)=>void}) {
  const [exs,setExs]=useState(initExercises);
  const [cur,setCur]=useState(2);
  const [curSet,setCurSet]=useState(1);
  const [active,setActive]=useState(false);
  const [timer,setTimer]=useState(45);
  const [acAuto,setAcAuto]=useState(true);
  const [acTemp,setAcTemp]=useState(22);
  const [musicOn,setMusicOn]=useState(false);
  const [track,setTrack]=useState(0);
  const ref=useRef<ReturnType<typeof setInterval>|null>(null);
  const e=exs[cur];
  useEffect(()=>{
    if(active&&timer>0){ref.current=setInterval(()=>setTimer(p=>p-1),1000);}
    else{if(ref.current)clearInterval(ref.current);}
    return()=>{if(ref.current)clearInterval(ref.current);};
  },[active,timer]);
  const startStop=()=>{
    const next=!active;
    setActive(next);
    if(!active&&e){
      onOpenTimer({kind:"timer",exercise:e.name,curSet,totalSets:e.sets,reps:timer>0?timer:e.reps,unit:e.unit,timeLeft:timer,totalTime:e.reps});
    }
  };
  const next=()=>{
    if(curSet<e.sets){setCurSet(p=>p+1);setTimer(e.rest);}
    else{setExs(p=>p.map((x,i)=>i===cur?{...x,done:true}:x));const ni=exs.findIndex((x,i)=>i>cur&&!x.done);if(ni!==-1){setCur(ni);setCurSet(1);setTimer(exs[ni].reps);}}
    setActive(false);
  };
  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const done=exs.filter(x=>x.done).length;
  const handleMusicToggle=()=>{const next=!musicOn;setMusicOn(next);if(next) onPlayMusic(tracks[track].title,tracks[track].artist);};

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-5 border" style={{background:W[5],borderColor:W[20]}}>
        <div className="flex items-center justify-between mb-3">
          <div><p className="text-sm font-bold" style={{color:W.ink}}>오늘의 운동 세션</p><p className="text-xs" style={{color:W.sub}}>전신 근력 루틴 · 중강도</p></div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:W.full,color:W.ink}}>{done}/{exs.length} 완료</span>
        </div>
        <div className="w-full h-1.5 rounded-full mb-1" style={{background:W[20]}}><div className="h-1.5 rounded-full transition-all" style={{width:`${Math.round((done/exs.length)*100)}%`,background:W.full}}/></div>
        <p className="text-xs" style={{color:W.sub}}>{Math.round((done/exs.length)*100)}% 달성</p>
      </div>
      {e&&(
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-xs mb-0.5" style={{color:W.sub}}>현재 동작</p><p className="text-xl font-bold" style={{color:W.ink}}>{e.name}</p><p className="text-sm" style={{color:W.sub}}>세트 {curSet}/{e.sets} · {e.reps}{e.unit}</p></div>
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke={W[10]} strokeWidth="8"/><circle cx="48" cy="48" r="40" fill="none" stroke={W.full} strokeWidth="8" strokeDasharray={`${2*Math.PI*40*(timer/e.reps)} ${2*Math.PI*40}`} strokeLinecap="round"/></svg>
              <div className="absolute inset-0 flex items-center justify-center"><p className="text-xl font-bold font-mono" style={{color:W.ink}}>{fmt(timer)}</p></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={startStop} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{background:active?W[20]:W.full,color:W.ink}}>
              {active?<><Pause size={14}/>일시정지</>:<><Play size={14}/>시작 (전체화면)</>}
            </button>
            <button onClick={next} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{background:W[10],color:W.ink}}><SkipForward size={14}/>다음</button>
          </div>
        </Card>
      )}
      <Card>
        <SHead title="운동 목록" sub="클릭하여 전환" icon={Dumbbell}/>
        <div className="space-y-1.5">{exs.map((x,i)=>(
          <button key={i} onClick={()=>{if(!x.done){setCur(i);setCurSet(1);setTimer(x.reps);setActive(false);}}} className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all" style={{background:i===cur?W[15]:x.done?W[5]:W[5],opacity:x.done&&i!==cur?0.55:1,border:`1.5px solid ${i===cur?W[40]:"transparent"}`}}>
            {x.done?<CheckCircle2 size={15} className="shrink-0" style={{color:W.full}}/>:i===cur?<div className="w-4 h-4 rounded-full border-2 shrink-0 animate-pulse" style={{borderColor:W.full}}/>:<Circle size={15} className="shrink-0" style={{color:W[40]}}/>}
            <span className={`flex-1 text-sm font-semibold ${x.done?"line-through":""}`} style={{color:x.done?W.sub:W.ink}}>{x.name}</span>
            <span className="text-xs" style={{color:W.sub}}>{x.sets}세트×{x.reps}{x.unit}</span>
            {i===cur&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:W.full,color:W.ink}}>진행 중</span>}
          </button>
        ))}</div>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <SHead title="에어컨 자동 제어" icon={Thermometer}/>
          <SRow icon={Wind} title="자동 온도 제어" desc="운동 시 실내 온도 자동 설정"><Toggle on={acAuto} onChange={setAcAuto}/></SRow>
          {acAuto&&<div className="mt-3"><div className="flex justify-between text-xs mb-2"><span style={{color:W.sub}}>목표 온도</span><span className="font-bold" style={{color:W.ink}}>{acTemp}°C</span></div><Slider value={acTemp} min={18} max={26} unit="°C" onChange={setAcTemp}/><div className="mt-2 rounded-xl p-2 flex items-center gap-2" style={{background:W[5]}}><div className="w-2 h-2 rounded-full animate-pulse" style={{background:W.full}}/><p className="text-xs" style={{color:W.ink}}>현재 {acTemp+1}°C → <strong>{acTemp}°C</strong> 조절 중</p></div></div>}
        </Card>
        <Card>
          <SHead title="운동 음악 재생" icon={Music}/>
          <SRow icon={Volume2} title="음악 자동 재생" desc="운동 시작 감지 시 재생"><Toggle on={musicOn} onChange={handleMusicToggle}/></SRow>
          {musicOn&&(
            <div className="mt-3 rounded-xl p-3" style={{background:W[5]}}>
              <p className="text-[10px] mb-1" style={{color:W.sub}}>지금 재생 중</p>
              <p className="text-sm font-semibold" style={{color:W.ink}}>{tracks[track].title}</p>
              <p className="text-xs mb-3" style={{color:W.sub}}>{tracks[track].artist}</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setTrack(p=>(p-1+tracks.length)%tracks.length)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:W[15]}}><ChevronLeft size={13} style={{color:W.ink}}/></button>
                <div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold cursor-pointer" style={{background:W.full,color:W.ink}} onClick={()=>onPlayMusic(tracks[track].title,tracks[track].artist)}><Maximize2 size={11}/> 전체화면</div>
                <button onClick={()=>setTrack(p=>(p+1)%tracks.length)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:W[15]}}><ChevronRight size={13} style={{color:W.ink}}/></button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <Card>
        <SHead title="생활패턴 기반 운동 추천" sub="수면·착석·활동 데이터 분석" icon={BrainCircuit}/>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[{l:"추천 강도",v:"중강도",d:"수면 7h + 착석 6h 기반",icon:Flame},{l:"최적 시간대",v:"오전 7~8시",d:"기상 후 1~2시간 내 피크",icon:Sun},{l:"권장 빈도",v:"주 4~5회",d:"현재 패턴 기반 지속 가능",icon:Activity}].map(s=>(
            <div key={s.l} className="rounded-xl p-3" style={{background:W[5]}}><div className="flex items-center gap-2 mb-1"><s.icon size={11} style={{color:W.ink}}/><p className="text-[10px]" style={{color:W.sub}}>{s.l}</p></div><p className="text-base font-bold" style={{color:W.ink}}>{s.v}</p><p className="text-[10px] mt-0.5" style={{color:W.sub}}>{s.d}</p></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══ EXPERT AGENTS PAGE ═══ */
function ExpertAgents({onPlayMusic,onOpenTimer}:{onPlayMusic:(t:string,a:string)=>void;onOpenTimer:(o:TimerOverlay)=>void}) {
  const [tab,setTab]=useState<AgentTab>("sleep");
  const tabs:[AgentTab,string,any][]=[["sleep","수면 Agent",Moon],["posture","자세 교정 Agent",StretchHorizontal],["fitness","피트니스 Agent",Dumbbell]];
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold" style={{color:W.ink}}>전문 Agent</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(([id,label,Icon])=>(
          <button key={id} onClick={()=>setTab(id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{background:tab===id?W.full:W[10],color:W.ink,border:`1.5px solid ${tab===id?W[60]:W[15]}`}}>
            <Icon size={14}/>{label}{tab===id&&<div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:W.full}}/>}
          </button>
        ))}
      </div>
      {tab==="sleep"&&<SleepAgent onPlayMusic={onPlayMusic}/>}
      {tab==="posture"&&<PostureAgent/>}
      {tab==="fitness"&&<FitnessAgent onPlayMusic={onPlayMusic} onOpenTimer={onOpenTimer}/>}
    </div>
  );
}

/* ═══ SIDEBAR (wide with labels, collapsible) ═══ */
const NAV:[Page,any,string][]=[["dashboard",LayoutDashboard,"대시보드"],["weekly",CalendarDays,"주간 계획"],["insights",Lightbulb,"인사이트"],["agents",Bot,"전문 Agent"]];

function Sidebar({page,setPage,onSettings}:{page:Page;setPage:(p:Page)=>void;onSettings:()=>void}) {
  const [collapsed,setCollapsed]=useState(false);
  return (
    <aside className={`shrink-0 flex flex-col h-screen sticky top-0 bg-white border-r z-10 transition-all duration-300 ${collapsed?"w-16":"w-56"}`}
      style={{borderColor:W[20]}}>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{borderColor:W[10]}}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:W.full}}><Activity size={15} style={{color:W.ink}}/></div>
        {!collapsed&&<div className="flex-1"><p className="text-sm font-bold leading-tight" style={{color:W.ink}}>WaveHome</p><p className="text-[10px] leading-tight" style={{color:W.sub}}>Health Intelligence</p></div>}
        <button onClick={()=>setCollapsed(p=>!p)} className="p-1 rounded-lg hover:opacity-60 transition-opacity" style={{color:W.sub}}>
          {collapsed?<ChevronRight size={14}/>:<ChevronLeft size={14}/>}
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map(([id,Icon,label])=>(
          <button key={id} onClick={()=>setPage(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${collapsed?"justify-center":""}`}
            style={{background:page===id?W[15]:"transparent",color:page===id?W.ink:W.sub}}>
            <Icon size={17}/>{!collapsed&&<span className="flex-1 text-left">{label}</span>}
            {!collapsed&&page===id&&<div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:W.full}}/>}
          </button>
        ))}
      </nav>
      <div className="px-2 pb-4 space-y-1 border-t pt-3" style={{borderColor:W[10]}}>
        {!collapsed&&(
          <div className="px-3 py-2 rounded-xl mb-2" style={{background:W[5]}}>
            <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:W.full}}/><p className="text-[10px] font-semibold" style={{color:W.full}}>레이더 연결됨</p></div>
            <p className="text-[9px]" style={{color:W.sub}}>방 1 / 방 2 / 서재</p>
          </div>
        )}
        <button onClick={onSettings}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-70 ${collapsed?"justify-center":""}`}
          style={{color:W.sub}}>
          <Settings size={16}/>{!collapsed&&"설정"}
        </button>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:opacity-70 transition-opacity ${collapsed?"justify-center":""}`}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:W[20]}}><User size={13} style={{color:W.ink}}/></div>
          {!collapsed&&<div><p className="text-xs font-semibold" style={{color:W.ink}}>김건강</p><p className="text-[9px]" style={{color:W.sub}}>프리미엄 플랜</p></div>}
        </div>
      </div>
    </aside>
  );
}

/* ═══ TOP BAR ═══ */
const PAGE_META:Record<Page,{title:string;sub:string}>={
  dashboard:{title:"대시보드",sub:"2026년 6월 23일 월요일"},
  weekly:{title:"주간 건강 계획",sub:"2026년 6월 23일 ~ 6월 29일"},
  insights:{title:"건강 인사이트",sub:"AI Agent 종합 분석 · 6월 3주차"},
  agents:{title:"전문 Agent",sub:"레이더 기반 · 웨어러블 불필요"},
};

function TopBar({page,onBell,unread}:{page:Page;onBell:()=>void;unread:number}) {
  const m=PAGE_META[page];
  return (
    <header className="h-14 bg-white border-b flex items-center px-5 gap-4 shrink-0" style={{borderColor:W[15]}}>
      <div className="flex-1"><p className="text-sm font-bold" style={{color:W.ink}}>{m.title}</p><p className="text-[10px]" style={{color:W.sub}}>{m.sub}</p></div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{background:W[10]}}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:W.full}}/><span className="text-xs font-medium" style={{color:W.ink}}>레이더 연결됨</span>
        </div>
        <button onClick={onBell} className="w-8 h-8 rounded-xl flex items-center justify-center relative" style={{background:W[10]}}>
          <Bell size={14} style={{color:W.ink}}/>
          {unread>0&&<div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center"><span className="text-[9px] text-white font-bold">{unread}</span></div>}
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{background:W.full,color:W.ink}}>김</div>
      </div>
    </header>
  );
}

/* ═══ APP ROOT ═══ */
export default function App() {
  const [page,setPage]=useState<Page>("dashboard");
  const [overlay,setOverlay]=useState<Overlay>(null);
  const [showSettings,setShowSettings]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [musicTrackIdx,setMusicTrackIdx]=useState(0);

  const unread=notifList.filter(n=>!n.read).length;

  const handlePlayMusic=(title:string,artist:string)=>{
    setOverlay({kind:"music",track:title,artist,playing:true});
  };
  const handleOpenTimer=(o:TimerOverlay)=>setOverlay(o);
  const handleMusicToggle=()=>{
    if(overlay?.kind==="music") setOverlay({...overlay,playing:!overlay.playing});
  };
  const handleMusicNext=()=>{
    const next=(musicTrackIdx+1)%tracks.length;
    setMusicTrackIdx(next);
    if(overlay?.kind==="music") setOverlay({...overlay,track:tracks[next].title,artist:tracks[next].artist});
  };
  const handleMusicPrev=()=>{
    const prev=(musicTrackIdx-1+tracks.length)%tracks.length;
    setMusicTrackIdx(prev);
    if(overlay?.kind==="music") setOverlay({...overlay,track:tracks[prev].title,artist:tracks[prev].artist});
  };

  const pageMap:Record<Page,React.ReactNode>={
    dashboard:<Dashboard/>,
    weekly:<WeeklyPlan/>,
    insights:<Insights/>,
    agents:<ExpertAgents onPlayMusic={handlePlayMusic} onOpenTimer={handleOpenTimer}/>,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{background:W.bg,fontFamily:"'Inter',sans-serif"}}>
      <Sidebar page={page} setPage={setPage} onSettings={()=>setShowSettings(true)}/>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar page={page} onBell={()=>setShowNotifs(p=>!p)} unread={unread}/>
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 lg:p-6 max-w-6xl mx-auto">{pageMap[page]}</div>
        </main>
      </div>

      {/* Overlays */}
      {overlay?.kind==="music"&&(
        <MusicOverlayView overlay={overlay} onClose={()=>setOverlay(null)} onToggle={handleMusicToggle} onNext={handleMusicNext} onPrev={handleMusicPrev}/>
      )}
      {overlay?.kind==="timer"&&(
        <TimerOverlayView overlay={overlay} onClose={()=>setOverlay(null)}/>
      )}
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)}/>}
      {showNotifs&&<NotificationsPanel onClose={()=>setShowNotifs(false)}/>}
    </div>
  );
}
