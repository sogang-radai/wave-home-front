import svgPaths from "./svg-rojrixvecv";
import imgDetail from "./5ec318fc294003b0754dd2b6f2516c7504e6a97a.png";

function Right() {
  return (
    <div className="absolute h-[11.336px] right-[26.67px] top-[17.33px] w-[66.661px]" data-name="right">
      <div className="absolute inset-[0_-2.91%_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 68.6005 11.336">
          <g id="right">
            <g id="Power">
              <g id="Vector" opacity="0.35">
                <path clipRule="evenodd" d={svgPaths.p2eeec630} fill="#112022" fillRule="evenodd" />
                <path d={svgPaths.p2a73d300} fill="#112022" />
              </g>
              <path d={svgPaths.p27742f80} fill="var(--fill-0, #112022)" id="Rectangle" />
            </g>
            <path d={svgPaths.p2cd90900} fill="var(--fill-0, #112022)" id="Wifi" />
            <path d={svgPaths.p25120800} fill="var(--fill-0, #112022)" id="Mobile Signal" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Left() {
  return (
    <div className="absolute h-[21px] left-[21px] top-[12px] w-[54px]" data-name="left">
      <div className="[word-break:break-word] absolute flex flex-col font-['SF_Pro_Text:Semibold',sans-serif] inset-[9.52%_0_4.76%_0] justify-end leading-[0] not-italic text-[#112022] text-[15px] text-center tracking-[-0.3px]">
        <p className="leading-[normal]">9:41</p>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="absolute bg-white h-[40px] left-0 overflow-clip top-0 w-[375px]" data-name="Status Bar">
      <Right />
      <Left />
    </div>
  );
}

function VuesaxLinearArrowLeft1() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/arrow-left">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="arrow-left">
          <path d={svgPaths.p3a43fe80} id="Vector" stroke="var(--stroke-0, #112022)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_2" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxLinearArrowLeft({ className }: { className?: string }) {
  return (
    <div className={className || "relative shrink-0 size-[20px]"} data-name="vuesax/linear/arrow-left">
      <VuesaxLinearArrowLeft1 />
    </div>
  );
}

function VuesaxOutlineHeart() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/outline/heart">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="heart">
          <path d={svgPaths.p360d0500} fill="var(--fill-0, #112022)" id="Vector" />
          <g id="Vector_2" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxOutlineMenu1() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/outline/menu">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="menu">
          <path d={svgPaths.p3d034e80} fill="var(--fill-0, #112022)" id="Vector" />
          <path d={svgPaths.p24a52700} fill="var(--fill-0, #112022)" id="Vector_2" />
          <path d={svgPaths.p2096a200} fill="var(--fill-0, #112022)" id="Vector_3" />
          <g id="Vector_4" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxOutlineMenu({ className }: { className?: string }) {
  return (
    <div className={className || "relative shrink-0 size-[20px]"} data-name="vuesax/outline/menu">
      <VuesaxOutlineMenu1 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] items-center left-0 pb-[16px] pt-[20px] px-[20px] top-[40px] w-[375px]">
      <VuesaxLinearArrowLeft />
      <div className="[word-break:break-word] flex flex-[1_0_0] flex-col font-['Poppins:Medium',sans-serif] justify-end leading-[0] min-w-px not-italic relative text-[#112022] text-[18px] tracking-[-0.36px]">
        <p className="leading-[1.3]">Indonesian pops</p>
      </div>
      <div className="relative shrink-0 size-[20px]" data-name="vuesax/outline/heart">
        <VuesaxOutlineHeart />
      </div>
      <VuesaxOutlineMenu />
    </div>
  );
}

function Frame5() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start leading-[0] min-w-px not-italic relative text-white">
      <div className="flex flex-col font-['Poppins:Bold',sans-serif] justify-end relative shrink-0 text-[24px] tracking-[-0.48px] w-full">
        <p className="leading-[1.3]">Hidup seperti ini</p>
      </div>
      <div className="flex flex-col font-['Poppins:Regular',sans-serif] justify-end relative shrink-0 text-[14px] w-full">
        <p className="leading-[1.4]">James adam</p>
      </div>
    </div>
  );
}

function Export() {
  return (
    <div className="col-1 ml-0 mt-0 relative row-1 size-[24px]" data-name="export">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="export">
          <path d={svgPaths.p2cdebac0} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p15fa13e0} fill="var(--fill-0, white)" id="Vector_2" />
          <g id="Vector_3" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxBoldExport() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="vuesax/bold/export">
      <Export />
    </div>
  );
}

function VuesaxBoldMusicFilter1() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/music-filter">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="music-filter">
          <g id="Vector" opacity="0" />
          <path d={svgPaths.p3ecaba80} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.pc9c0e80} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p140b6200} fill="var(--fill-0, white)" id="Vector_4" />
          <path d={svgPaths.p291cde80} fill="var(--fill-0, white)" id="Vector_5" />
          <path d={svgPaths.p16d39cf0} fill="var(--fill-0, white)" id="Vector_6" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxBoldMusicFilter({ className }: { className?: string }) {
  return (
    <div className={className || "relative shrink-0 size-[24px]"} data-name="vuesax/bold/music-filter">
      <VuesaxBoldMusicFilter1 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <VuesaxBoldExport />
      <VuesaxBoldMusicFilter />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
      <Frame5 />
      <Frame3 />
    </div>
  );
}

function Frame() {
  return (
    <div className="flex-[1_0_0] h-[12px] min-w-px relative rounded-[100px]">
      <div className="absolute bg-[rgba(255,255,255,0.3)] h-[8px] left-0 rounded-[100px] top-[2px] w-[287px]" />
      <div className="absolute bg-white h-[8px] left-0 rounded-[100px] top-[2px] w-[208px]" />
      <div className="-translate-y-1/2 absolute left-[200px] size-[16px] top-1/2">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" fill="var(--fill-0, white)" id="Ellipse 1" r="8" />
        </svg>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <Frame />
      <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[12px] text-right text-white tracking-[-0.24px] w-[40px]">
        <p className="leading-[1.3]">-1:40</p>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center justify-end relative shrink-0 w-full">
      <Frame8 />
      <Frame4 />
    </div>
  );
}

function VuesaxBoldRepeateMusic1() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/repeate-music">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="repeate-music">
          <g id="Vector" opacity="0" />
          <path d={svgPaths.p1fe9a240} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p14462600} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p36474580} fill="var(--fill-0, white)" id="Vector_4" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxBoldRepeateMusic({ className }: { className?: string }) {
  return (
    <div className={className || "relative shrink-0 size-[32px]"} data-name="vuesax/bold/repeate-music">
      <VuesaxBoldRepeateMusic1 />
    </div>
  );
}

function VuesaxBoldNext1() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/next">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="next">
          <g id="Vector" opacity="0" />
          <path d={svgPaths.p127c0400} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.pa22cc80} fill="var(--fill-0, white)" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxBoldNext({ className }: { className?: string }) {
  return (
    <div className={className || "relative shrink-0 size-[32px]"} data-name="vuesax/bold/next">
      <VuesaxBoldNext1 />
    </div>
  );
}

function VuesaxBoldPause() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/pause">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="pause">
          <path d={svgPaths.p38610040} fill="var(--fill-0, #112022)" id="Vector" />
          <path d={svgPaths.p355e7480} fill="var(--fill-0, #112022)" id="Vector_2" />
          <g id="Vector_3" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-white content-stretch flex items-center p-[16px] relative rounded-[50px] shrink-0">
      <div className="relative shrink-0 size-[28px]" data-name="vuesax/bold/pause">
        <VuesaxBoldPause />
      </div>
    </div>
  );
}

function VuesaxBoldPrevious1() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/previous">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="previous">
          <g id="Vector" opacity="0" />
          <path d={svgPaths.p2ad13b00} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p920d700} fill="var(--fill-0, white)" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxBoldPrevious({ className }: { className?: string }) {
  return (
    <div className={className || "relative shrink-0 size-[32px]"} data-name="vuesax/bold/previous">
      <VuesaxBoldPrevious1 />
    </div>
  );
}

function VuesaxBoldVolumeHigh() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/volume-high">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="volume-high">
          <path d={svgPaths.p463900} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p112f1c80} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p14113e00} fill="var(--fill-0, white)" id="Vector_3" />
          <g id="Vector_4" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <VuesaxBoldRepeateMusic />
      <VuesaxBoldNext />
      <Frame10 />
      <VuesaxBoldPrevious />
      <div className="relative shrink-0 size-[32px]" data-name="vuesax/bold/volume-high">
        <VuesaxBoldVolumeHigh />
      </div>
    </div>
  );
}

function Singer() {
  return (
    <div className="bg-[rgba(255,255,255,0.3)] content-stretch flex flex-col items-center overflow-clip px-[8px] py-[6px] relative rounded-[100px] shrink-0 w-[100px]" data-name="Singer">
      <div className="[word-break:break-word] flex flex-col font-['Poppins:Medium',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white tracking-[-0.28px] whitespace-nowrap">
        <p className="leading-[1.3]">Open lirics</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[28px] items-center justify-end pb-[12px] pt-[20px] px-[20px] relative rounded-[8px] shrink-0 w-[375px]">
      <Frame7 />
      <Frame9 />
      <Singer />
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute backdrop-blur-[22px] bg-gradient-to-b bottom-0 content-stretch flex flex-col from-[rgba(255,255,255,0.1)] items-center justify-end left-0 px-[20px] rounded-[8px] to-[rgba(255,255,255,0.01)] w-[375px]">
      <Frame2 />
      <div className="h-[32px] relative shrink-0 w-[375px]" data-name="1. Indicator">
        <div className="-translate-x-1/2 absolute bg-white bottom-[8px] h-[5px] left-1/2 rounded-[100px] w-[135px]" data-name="Line" />
      </div>
    </div>
  );
}

export default function Detail() {
  return (
    <div className="overflow-clip relative rounded-[20px] size-full" data-name="Detail">
      <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[20px]">
        <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
        <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgDetail} />
      </div>
      <StatusBar />
      <Frame1 />
      <Frame6 />
    </div>
  );
}