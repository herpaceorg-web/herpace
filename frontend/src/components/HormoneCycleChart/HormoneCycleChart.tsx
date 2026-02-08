import * as React from "react";
import { CalendarDays, Snowflake, Sprout, Sun, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DateRange } from "react-day-picker";
import { api } from "@/lib/api-client";
import type { CyclePositionDto, ReportPeriodRequest, ReportPeriodResponse } from "@/types/api";

interface HormoneData {
  day: number;
  estrogen: number;
  progesterone: number;
  fsh: number;
  lh: number;
}

// Computes phase day boundaries for display purposes.
// Follicular and luteal phases are split evenly (each half of cycle minus menstrual/ovulation).
const computePhaseBoundaries = (cycleLength: number) => {
  const menstrualEnd = 5;
  const ovulatoryDays = 2;
  // Split remaining days evenly between follicular and luteal
  const remainingDays = cycleLength - menstrualEnd - ovulatoryDays;
  const follicularDays = Math.round(remainingDays / 2);
  const lutealDays = remainingDays - follicularDays;
  const follicularEnd = menstrualEnd + follicularDays;
  const ovulatoryEnd = follicularEnd + ovulatoryDays;
  return { menstrualEnd, follicularEnd, ovulatoryEnd, follicularDays, ovulatoryDays, lutealDays };
};

// Generates the four hormone curves scaled to the user's actual cycle length.
// Inflection points (peaks, troughs, transitions) are mapped to computed phase
// boundaries so the curve shapes remain biologically consistent regardless of
// whether the cycle is 21 or 45 days.
const generateHormoneData = (cycleLength: number): HormoneData[] => {
  const { follicularEnd, ovulatoryEnd, lutealDays } = computePhaseBoundaries(cycleLength);
  const data: HormoneData[] = [];

  // Estrogen reference points mapped to phase boundaries
  const estrRiseStart = follicularEnd - 2;
  const estrPeak = ovulatoryEnd;
  const estrDropEnd = ovulatoryEnd + Math.max(1, Math.round(lutealDays * 0.15));
  const estrSecondPeak = ovulatoryEnd + Math.round(lutealDays * 0.50);

  // Progesterone reference points
  const progRiseStart = follicularEnd + 1;
  const progPeakStart = ovulatoryEnd + Math.round(lutealDays * 0.50);
  const progPeakEnd = ovulatoryEnd + Math.round(lutealDays * 0.65);

  // FSH reference points
  const fshRiseStart = follicularEnd - 2;
  const fshPeakEnd = ovulatoryEnd + 1;
  const fshDropEnd = ovulatoryEnd + Math.max(2, Math.round(lutealDays * 0.28));

  for (let day = 1; day <= cycleLength; day++) {
    // Estrogen: low → rises late follicular → peaks at ovulation →
    //           brief dip → smaller luteal peak → drops
    let estrogen: number;
    if (day <= estrRiseStart) {
      estrogen = 25;
    } else if (day <= follicularEnd) {
      const t = (day - estrRiseStart) / Math.max(1, follicularEnd - estrRiseStart);
      estrogen = 25 + Math.pow(t, 2) * 45;
    } else if (day <= estrPeak) {
      const t = (day - follicularEnd) / Math.max(1, estrPeak - follicularEnd);
      estrogen = 70 + Math.pow(t, 0.5) * 30;
    } else if (day <= estrDropEnd) {
      const t = (day - estrPeak) / Math.max(1, estrDropEnd - estrPeak);
      estrogen = 100 - Math.pow(t, 2) * 35;
    } else if (day <= estrSecondPeak) {
      const t = (day - estrDropEnd) / Math.max(1, estrSecondPeak - estrDropEnd);
      estrogen = 65 + Math.pow(t, 1.5) * 20;
    } else {
      const t = (day - estrSecondPeak) / Math.max(1, cycleLength - estrSecondPeak);
      estrogen = 85 - Math.pow(t, 1.2) * 60;
    }

    // Progesterone: flat until ovulation → rises → peaks mid-late luteal → drops
    let progesterone: number;
    if (day <= progRiseStart) {
      progesterone = 10;
    } else if (day <= progPeakStart) {
      const t = (day - progRiseStart) / Math.max(1, progPeakStart - progRiseStart);
      progesterone = 10 + Math.pow(t, 1.8) * 100;
    } else if (day <= progPeakEnd) {
      progesterone = 110;
    } else {
      const t = (day - progPeakEnd) / Math.max(1, cycleLength - progPeakEnd);
      progesterone = 110 - Math.pow(t, 1.5) * 90;
    }

    // FSH: flat → rises late follicular → peaks at ovulation → drops
    let fsh: number;
    if (day <= fshRiseStart) {
      fsh = 25;
    } else if (day <= progRiseStart) {
      const t = (day - fshRiseStart) / Math.max(1, progRiseStart - fshRiseStart);
      fsh = 25 + Math.pow(t, 1.5) * 60;
    } else if (day <= fshPeakEnd) {
      fsh = 85;
    } else if (day <= fshDropEnd) {
      const t = (day - fshPeakEnd) / Math.max(1, fshDropEnd - fshPeakEnd);
      fsh = 85 - Math.pow(t, 1.3) * 50;
    } else {
      const t = (day - fshDropEnd) / Math.max(1, cycleLength - fshDropEnd);
      fsh = 35 - Math.pow(t, 0.8) * 10;
    }

    // LH: gentle rise → sharp spike at ovulation → rapid drop
    let lh: number;
    if (day < follicularEnd) {
      const t = (day - 1) / Math.max(1, follicularEnd - 2);
      lh = 17 + t * 20;
    } else if (day === follicularEnd) {
      lh = 45;
    } else if (day === follicularEnd + 1) {
      lh = 95;
    } else if (day <= ovulatoryEnd) {
      lh = 85;
    } else if (day === ovulatoryEnd + 1) {
      lh = 40;
    } else {
      const t = (day - ovulatoryEnd - 1) / Math.max(1, lutealDays - 1);
      lh = 20 - t * 5;
    }

    data.push({
      day,
      estrogen: Math.max(0, estrogen),
      progesterone: Math.max(0, progesterone),
      fsh: Math.max(0, fsh),
      lh: Math.max(0, lh),
    });
  }

  return data;
};

const HORMONE_COLORS = {
  estrogen: "#efa910",
  progesterone: "#a14139",
  fsh: "#677344",
  lh: "#597d93",
};

interface PhaseChartProps {
  data: HormoneData[];
  phaseType: "follicular" | "luteal";
}

const FollicularHormonesSvg: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 640 199" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <g clipPath="url(#clip0_follicular)">
      <path d="M0 0H640V191C640 195.418 636.418 199 632 199H7.99999C3.58171 199 0 195.418 0 191V0Z" fill="#FCF9F3"/>
      <path d="M1212.22 172.897C1199.1 171.893 1158.72 162.863 1146.6 158.849C1131.29 155.151 1108.85 148.059 1083.83 140.148C1051.14 129.81 1025.47 119.621 982.566 110.686C929.57 99.6486 869.002 116.489 819.034 133.764C811.37 136.414 775.252 146.598 768.561 148.815C681.243 173.9 669.969 175.685 607.047 81.0857C605.667 79.0104 603.946 74.2197 602.505 72.0549C581.811 37.4377 571.212 10.8476 555.06 9.84424C538.909 9.84424 503.5 48.5 474 68C368.007 143.255 341.055 139.283 282.507 151.324C244.384 159.164 187.617 169.014 159.857 171.893C111.588 176.9 75.8845 176.702 38.233 176.494C30.6089 176.451 22.9044 176.409 15 176.409C15 402.676 1265.72 415.218 1265.72 176.409C1256.03 177.122 1241.83 175.715 1228.21 174.367C1222.67 173.818 1217.22 173.279 1212.22 172.897Z" fill="url(#paint0_follicular)"/>
      <path d="M5 174.922C5 174.922 31.3306 174.922 45.4266 174.922C59.5227 174.922 67.4346 175.252 81.5218 174.922C95.6089 174.592 105.327 174.094 120.505 173.017C135.682 171.94 148.002 171.87 161 170.5C173.998 169.129 181.528 168.153 194 166.5C206.472 164.847 213.601 162.773 225.903 160.636C238.204 158.499 248.797 157.381 263.5 154.5C278.203 151.619 290.179 149.792 304 146.569C317.821 143.345 328 142 340.5 138.5C353 135 360.554 132.546 372.5 127.569C384.446 122.591 395.876 116.575 407 110.569C418.124 104.563 423.036 101.071 433.5 94.5686C443.964 88.0666 455.5 80.0686 463.5 74.4998C471.5 68.9309 479.51 63.2698 487.5 56.9998C495.49 50.7297 501.371 45.5306 509.5 39.0686C517.629 32.6066 523.5 27.4996 529 22.9998C534.5 18.5 548.932 8.00635 556 8.99976C563.068 9.99316 567.718 14.6845 571 19.0688C574.282 23.453 577.509 28.0805 582 35.0688C587.759 44.0315 591.216 50.7605 596.5 59.9998C602.659 70.7694 605.238 76.5825 612 86.9998C619.252 98.1718 621.651 103.157 630 113.569C639.357 125.238 645.206 138.338 651.239 144.271C657.272 150.205 662.169 153.527 669.151 156.826C676.133 160.125 680.91 161.781 689.365 162.541C697.819 163.3 706.969 162.194 715.349 161.134C723.728 160.073 732.637 157.342 745.673 153.969C758.71 150.596 772.23 146.228 784.656 142.54C797.082 138.851 804.03 136.757 816.42 133.016C828.809 129.275 842.322 124.564 853.959 121.587C865.595 118.61 875.593 115.392 887.519 112.964C899.446 110.536 905.892 109.662 920.374 108.253C934.855 106.844 949.206 106.844 963.688 108.253C978.17 109.662 986.465 111.785 999.783 114.92C1013.1 118.055 1020.04 120.693 1032.99 124.444C1045.94 128.195 1059.44 131.951 1071.97 135.873C1084.5 139.795 1091.07 142.632 1103.74 146.35C1116.41 150.067 1125.27 152.791 1138.2 156.193C1151.14 159.595 1163.72 162.736 1175.93 165.398C1188.14 168.059 1195.12 169.338 1207.69 171.112C1220.26 172.887 1241.92 174.76 1248.12 174.922C1254.32 175.084 1264 174.922 1264 174.922" stroke="#EFA910" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"/>
      <path d="M1245.84 180.497C1239.14 180.557 1221.86 181.745 1209.22 181.994C1196.58 182.244 1194.29 183.992 1162.29 182.493C1130.3 180.995 1105.57 183.991 1042.65 182.493C979.729 180.996 898.534 181.25 855.454 173.012C812.374 164.774 823.274 171.533 780.677 157.542C738.08 143.551 681.927 112.634 661.55 97.1589C641.173 81.684 641.999 78.0003 638.999 74.0003C636.04 69.8531 632.999 65.0003 629.499 58.5003C625.999 52.0003 622.999 44.5003 618.5 34.5003C614.5 25 612 17.5 610.5 14.0003C608.5 10 603.999 1.65316 597 2.00024C590.499 2.32276 585.912 9.65317 583.5 14.5002C581.087 19.3473 580 26.0002 578.5 33.0002C577 40.0003 574.859 52.5842 572.971 61.0842C571.082 69.5842 569.093 79.111 568.471 82.0842C567.849 85.0575 564.867 93.6691 561.471 101.084C558.074 108.499 558.499 108 548 125.5C535.499 143.083 509.564 173.486 466 183.5C422.436 193.515 233.794 177.753 197.936 176.505C162.078 175.257 67.6602 175.436 49.414 178.002C41.798 179.073 36.3 179 19.5 182.5C2.7 186 -13.0973 189.585 -15.9995 257.5C-20.981 374.073 1291.11 297.971 1282.97 174.509C1274.83 51.0468 1267.02 178.244 1262.86 179C1258.69 179.756 1252.53 180.438 1245.84 180.497Z" fill="url(#paint1_follicular)"/>
      <path d="M5.04492 185C5.04492 185 15.5439 182.031 22.5907 180.64C29.6376 179.248 39.4168 178.169 50.3716 177.152C61.3264 176.134 68.1681 175.907 79.6146 175.408C91.0611 174.908 102.776 174.709 117.631 174.536C132.485 174.362 141.695 174.329 157.109 174.536C172.522 174.742 200.453 176.14 227.292 177.152C254.13 178.163 269.184 178.67 296.013 179.768C322.842 180.865 360.131 182.813 374.969 183.256C389.808 183.698 398.128 184.064 412.985 184.128C427.842 184.192 452.246 185.541 462.683 183.5C473.12 181.459 477.252 179.519 486.515 176C495.779 172.481 503.245 168.336 512.411 162.327C521.578 156.318 524.941 151.801 531.419 144.886C537.898 137.972 540.95 133.889 546.041 126.573C551.132 119.257 558.475 106.523 563.587 93.4361C568.699 80.3487 570.423 68.2646 572.359 59.4266C574.296 50.5887 575.152 44.2551 576.746 36.7536C578.34 29.2521 579.455 22.1376 581.132 17.5688C582.809 13 584.458 10.2087 586.981 7.10437C589.504 4.00002 592.829 0.982632 597.216 1.0001C601.603 1.01758 604.251 3.14951 607.012 6.50002C609.072 9.00002 611.494 13.2559 613.167 18C615.612 24.9312 617.38 29.4066 620.611 36.7536C624.615 45.8615 626.39 50.9441 631.205 59.5C636.153 68.2938 639.04 73.1098 645.632 81C650.833 87.2253 655.703 91.8185 662.11 97.5C671.431 105.764 677.466 110.212 686.407 116.109C695.348 122.006 701.819 125.11 711.264 130.062C720.709 135.013 725.811 137.976 736.12 142.27C746.43 146.564 756.275 149.561 769.75 153.607C783.224 157.653 798.6 161.923 818.001 165.815C837.402 169.707 854.742 171.679 870.638 173.664C886.535 175.648 895.484 176.727 911.579 178.024C927.674 179.32 948.964 180.08 972.989 180.64C997.014 181.2 1020.15 180.464 1047.56 180.64C1074.97 180.815 1096.04 181.583 1117.74 181.512C1139.45 181.441 1157.32 180.746 1173.3 180.64C1189.29 180.533 1199.94 180.999 1214.24 180.64C1228.55 180.28 1239.1 180.276 1250.8 178.896C1262.49 177.515 1280.04 173.664 1280.04 173.664" stroke="#677344" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"/>
      <path d="M1249.86 161C1241.59 162.5 1221.43 166.5 1213.16 167C1199.2 168.5 1180.08 171.167 1165.6 172.5C1133.04 175.5 1083.42 180.5 1046.71 180.5C960.391 180.5 913.87 182 875.102 177C858.435 174.85 821.447 172.61 807.387 170.5C747.425 161.5 727.783 156.5 716.928 154C713.309 153.167 680.152 148.157 678.677 146C634.222 132.5 610.5 122 593 121C572 121.5 562.199 140.061 538 157C513 174.5 483.802 167.5 470.88 167.5C411.5 158 264.014 144 233 144C184 141.5 97.3357 147 56.5 153C36.8575 156.5 10.8317 164 3.07812 167C3.07812 392.501 1287.08 393 1287.08 155C1277.16 155.711 1270.54 157.5 1266.4 158.5C1260.71 159.5 1255.03 160.5 1249.86 161Z" fill="url(#paint2_follicular)"/>
      <path d="M5.05469 164.895C5.05469 164.895 23.5196 160.302 31.435 158.738C39.3503 157.174 44.6042 156.092 52.617 154.718C60.6298 153.344 64.3587 152.846 72.471 151.701C80.5832 150.557 87.6043 149.899 97.3857 149.063C107.167 148.226 114.354 147.974 125.232 147.303C136.109 146.633 145.396 145.978 154.543 145.544C163.69 145.11 168.823 144.863 177.992 144.665C187.161 144.466 198.788 144.665 210.235 144.665C221.681 144.665 234.378 144.428 239.546 144.665C244.714 144.901 254.257 145.457 259.41 145.795C264.562 146.133 269.735 146.477 280.582 147.303C291.43 148.13 300.749 149.195 309.893 149.942C319.038 150.689 324.205 150.925 333.343 151.701C342.48 152.478 358.164 153.989 368.516 155.22C378.869 156.451 385.206 157.584 394.897 158.738C404.588 159.893 413.043 161.129 422.742 162.257C432.442 163.384 442.13 164.538 453.519 165.775C464.909 167.012 477.687 168.034 482.831 168.414C487.975 168.794 490.839 169.231 496.021 169.293C501.203 169.355 507.395 169.117 512.142 168.414C516.89 167.711 520.02 167.141 523.867 165.775C527.714 164.409 529.4 163.212 532.66 161.377C535.92 159.541 540.056 156.679 544.385 153.461C548.713 150.242 555.886 143.492 560.506 139.387C565.127 135.282 569.636 131.074 573.696 128.653C577.757 126.232 582.286 124.117 583.955 123.554C585.625 122.991 587.817 122 591.829 122C595.84 122 597.468 122.358 600.077 122.675C602.685 122.991 608.372 124.726 609.406 124.974C610.44 125.222 616.637 126.796 623.526 128.832C630.415 130.868 644.698 135.897 652.837 138.508C660.976 141.118 669.449 143.127 677.752 145.544C686.055 147.962 693.795 149.351 704.132 151.701C714.469 154.052 721.01 155.612 731.978 157.859C742.946 160.105 761.728 163.498 775.945 165.775C790.163 168.052 803.462 169.915 812.584 171.052C821.707 172.19 827.48 172.873 836.034 173.691C844.587 174.509 851.19 174.911 858.074 175.538C864.958 176.165 871.623 176.706 878.535 177.21C885.447 177.713 893.336 178.538 903.051 179.009C912.766 179.479 917.505 179.507 928.365 179.848C939.224 180.19 948.528 179.848 959.402 179.848C970.277 179.848 1007.02 180.059 1023.63 179.848C1040.23 179.638 1049.55 179.591 1066.13 178.969C1082.7 178.347 1094.76 177.63 1113.03 176.33C1131.29 175.03 1154.41 172.898 1171.65 171.052C1188.89 169.207 1198.56 168.149 1215.62 165.775C1232.67 163.401 1283.03 154.34 1283.03 154.34" stroke="#4E6D80" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6.08008 180.41C67.2766 183.91 144.302 182.714 221.798 179.91C243.727 179.91 282.995 179.91 302.373 179.91C371.73 179.91 399.268 179.91 440.066 179.91C511.972 177.91 572.148 171.5 599.177 162C713.41 138.899 804.185 83.9999 829.684 71.9999C855.692 62.5 946.467 8.50008 1030.61 27.9999C1103.03 37.9999 1153.52 102.5 1190.23 132C1202.98 145 1215.22 153.911 1223.38 158.911C1241.74 168.411 1260.1 168.5 1272.85 168C1272.85 406 6.08008 405.911 6.08008 180.41Z" fill="url(#paint3_follicular)"/>
      <path d="M5.05469 179.85C24.8896 179.85 36.0102 179.85 55.845 179.85C83.0471 179.85 98.2983 179.85 125.5 179.85C168.57 179.85 192.718 179.85 235.788 179.85C290.759 179.85 321.58 180.18 376.55 179.85C412.82 179.633 433.202 180.768 469.424 178.925C480.767 178.348 487.123 177.945 498.447 177.076C513.772 175.9 522.389 175.353 537.628 173.377C556.459 170.934 566.944 168.944 585.516 165.054C602.071 161.586 611.314 159.4 627.599 154.881C645.95 149.789 656.037 146.251 674.036 140.084C690.017 134.609 699.031 131.633 714.668 125.288C730.218 118.978 738.601 114.688 753.85 107.717C768.634 100.958 776.838 96.9932 791.58 90.1458C804.042 84.357 811.028 81.1096 823.505 75.3492C833.7 70.6422 839.345 67.8534 849.626 63.3269C862.539 57.6415 869.897 54.7079 883.002 49.4551C893.162 45.3831 898.769 42.8607 909.123 39.2825C919.747 35.6109 925.739 33.5441 936.695 30.9594C946.771 28.5822 952.516 27.4933 962.816 26.3355C976.895 24.7528 984.937 24.7615 999.094 25.4107C1009.91 25.9065 1016.03 26.2205 1026.67 28.185C1035.3 29.7797 1040.04 31.2063 1048.43 33.7338C1055.9 35.9805 1060.07 37.3293 1067.3 40.2073C1076.03 43.6813 1089.07 50.3799 1089.07 50.3799C1089.07 50.3799 1098.96 56.3503 1105.03 60.5526C1111.45 64.9978 1114.84 67.7727 1120.99 72.5748C1129.08 78.8931 1133.54 82.5326 1141.31 89.221C1151.82 98.2756 1167.43 113.265 1167.43 113.265L1190.65 134.536C1190.65 134.536 1205.75 147.542 1216.77 153.956C1223.85 158.078 1227.93 160.322 1235.63 163.204C1242.22 165.668 1247.14 166.991 1252.98 168.099C1258.82 169.207 1260.43 169.462 1265.26 169.677C1267.85 169.793 1271.91 169.677 1271.91 169.677" stroke="#A14139" strokeOpacity="0.4" strokeWidth="2" strokeMiterlimit="1.41421" strokeLinecap="round"/>
    </g>
    <defs>
      <linearGradient id="paint0_follicular" x1="-10.7088" y1="10.9999" x2="-14.176" y2="213.501" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#EFA910" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint1_follicular" x1="22.6273" y1="18.4999" x2="18.7159" y2="221.004" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#677344" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint2_follicular" x1="31.9999" y1="50" x2="21.3487" y2="205.512" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#4E6D80" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint3_follicular" x1="6.08008" y1="25.3086" x2="6.08008" y2="179.809" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#A14139" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <clipPath id="clip0_follicular">
        <path d="M0 0H640V191C640 195.418 636.418 199 632 199H7.99999C3.58171 199 0 195.418 0 191V0Z" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const LutealHormonesSvg: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 640 199" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <g clipPath="url(#clip0_luteal)">
      <path d="M0 0H640V191C640 195.418 636.418 199 632 199H7.99999C3.58171 199 0 195.418 0 191V0Z" fill="#FCF9F3"/>
      <path d="M599.283 180.5C591.012 181 570.853 181.5 562.582 182C545.524 182 542.362 181.5 516 181.5C482 183 432.2 181.5 395.5 181.5C306.075 178.5 270.5 181 207.5 172.5C189.5 171 149 162.5 133.031 157.5C109.5 151 88 144.5 66 132C54.5717 126.243 44.2004 120.484 36 115C22.1748 105.754 13.9415 97.9415 13 97C11.5 95.5 7 91.6316 3.5 88C-1.5 83 -7.7514 73.7426 -8.60138 72.5C-31.5172 39 -32.3791 1.5 -50.4709 1.5C-74.2487 3.5 -71.6641 54 -80.9684 82C-90.2728 110 -118.186 170.569 -182.799 183.5C-221.841 191.313 -420.06 176.5 -451.074 176.5C-491.91 174 -558.074 174.625 -599.944 178C-618.552 179.5 -638.712 183.5 -646.465 186.5C-646.465 402.782 542.31 411.163 639.073 201.5C643.198 192.563 640 183.23 640 173.5C630.5 175.5 623.828 177.348 616.5 178.5C610.814 179 605 180.5 599.283 180.5Z" fill="url(#paint0_luteal)"/>
      <path d="M-645.033 185C-645.033 185 -634.486 182.031 -627.406 180.64C-620.327 179.248 -610.502 178.169 -599.497 177.152C-588.491 176.134 -581.618 175.907 -570.118 175.408C-558.619 174.908 -546.849 174.709 -531.926 174.536C-517.003 174.362 -507.75 174.329 -492.266 174.536C-476.781 174.742 -448.72 176.14 -421.758 177.152C-394.795 178.163 -379.671 178.67 -352.718 179.768C-325.765 180.865 -288.304 182.813 -273.397 183.256C-258.489 183.698 -250.13 184.064 -235.205 184.128C-220.279 184.192 -195.762 185.541 -185.277 183.5C-174.792 181.459 -170.641 179.519 -161.334 176C-152.028 172.481 -144.527 168.336 -135.318 162.327C-126.11 156.318 -122.731 151.801 -116.222 144.886C-109.714 137.972 -106.648 133.889 -101.533 126.573C-96.4188 119.257 -89.042 106.523 -83.9062 93.4361C-78.7703 80.3487 -77.0381 68.2646 -75.0927 59.4266C-73.1473 50.5887 -72.2872 44.2551 -70.6859 36.7536C-69.0847 29.2522 -67.964 22.1376 -66.2792 17.5688C-64.5943 13 -62.9379 10.2087 -60.4035 7.10437C-57.8691 4.00002 -54.8336 0.979561 -50.1211 1.0001C-45.6817 1.01946 -43.0533 3.14951 -40.28 6.50002C-38.2107 9.00002 -35.7768 13.2559 -34.096 18C-31.6403 24.9312 -29.8637 29.4066 -26.6183 36.7536C-22.5952 45.8615 -20.8116 50.9441 -15.975 59.5C-11.0038 68.2938 -8.10315 73.1098 -1.48067 81C3.74434 87.2253 8.63652 91.8185 15.0737 97.5C24.4369 105.764 30.5006 110.212 39.483 116.109C48.4653 122.006 54.9656 125.11 64.4546 130.062C73.9437 135.013 79.0686 137.976 89.4262 142.27C99.7838 146.564 109.675 149.561 123.211 153.607C136.748 157.653 152.195 161.923 171.686 165.815C191.176 169.707 208.597 171.679 224.567 173.664C240.537 175.648 249.527 176.727 265.696 178.024C281.866 179.32 303.255 180.08 327.391 180.64C351.527 181.2 374.766 180.464 402.306 180.64C429.845 180.815 451.008 181.583 472.814 181.512C494.62 181.441 512.572 180.746 528.633 180.64C544.694 180.533 555.388 180.999 569.763 180.64C584.137 180.28 594.735 180.276 606.486 178.896C618.236 177.515 635.864 173.664 635.864 173.664" stroke="#677344" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"/>
      <path d="M602.781 160C594.511 161.5 574.351 165.5 566.081 166C552.124 167.5 532.999 170.167 518.525 171.5C485.96 174.5 436.337 179.5 399.636 179.5C313.313 179.5 266.791 181 228.023 176C211.357 173.85 174.368 171.61 160.308 169.5C100.347 160.5 80.7045 155.5 69.8494 153C66.2311 152.167 33.074 147.157 31.5983 145C-12.8558 131.5 -39.2181 123.5 -54.2084 121C-76.9523 124 -86.1785 140.015 -108.484 157C-132.778 175.5 -163.276 166.5 -176.199 166.5C-236.677 161 -383.479 144.5 -414.493 144.5C-454.812 143.5 -549.406 148 -590.242 154C-609.884 157.5 -636.246 163 -644 166C-644 375.49 482.643 389.203 639.999 199.5C652.025 185.002 639.999 170.898 639.999 154C630.079 154.711 623.458 156.5 619.322 157.5C613.636 158.5 607.95 159.5 602.781 160Z" fill="url(#paint1_luteal)"/>
      <path d="M-644 164.895C-644 164.895 -625.493 160.302 -617.559 158.738C-609.626 157.174 -604.36 156.092 -596.329 154.718C-588.298 153.344 -584.561 152.846 -576.43 151.701C-568.299 150.557 -561.262 149.899 -551.458 149.063C-541.654 148.226 -534.451 147.974 -523.549 147.303C-512.646 146.633 -503.338 145.978 -494.17 145.544C-485.003 145.11 -479.858 144.863 -470.668 144.665C-461.477 144.466 -449.824 144.665 -438.351 144.665C-426.878 144.665 -414.153 144.428 -408.973 144.665C-403.793 144.901 -394.228 145.457 -389.064 145.795C-383.9 146.133 -378.716 146.477 -367.843 147.303C-356.971 148.13 -347.63 149.195 -338.465 149.942C-329.3 150.689 -324.121 150.925 -314.962 151.701C-305.804 152.478 -290.084 153.989 -279.708 155.22C-269.332 156.451 -262.981 157.584 -253.268 158.738C-243.554 159.893 -235.08 161.129 -225.358 162.257C-215.636 163.384 -205.927 164.538 -194.511 165.775C-183.095 167.012 -170.288 168.034 -165.132 168.414C-159.977 168.794 -157.106 169.231 -151.912 169.293C-146.719 169.355 -140.513 169.117 -135.754 168.414C-130.996 167.711 -127.858 167.141 -124.003 165.775C-120.147 164.409 -118.457 163.212 -115.189 161.377C-111.922 159.541 -107.776 156.679 -103.438 153.461C-99.0994 150.242 -91.9108 143.492 -87.2798 139.387C-82.6487 135.282 -78.129 131.074 -74.0595 128.653C-69.99 126.232 -65.4504 124.117 -63.7771 123.554C-62.1037 122.991 -59.9066 122 -55.8858 122C-51.865 122 -50.2334 122.358 -47.6189 122.675C-45.0044 122.991 -39.3046 124.726 -38.2683 124.974C-37.2319 125.222 -31.0207 126.796 -24.1162 128.832C-17.2117 130.868 -2.89558 135.897 5.26212 138.508C13.4198 141.118 21.9117 143.127 30.2338 145.544C38.5559 147.962 46.3139 149.351 56.6743 151.701C67.0347 154.052 73.5906 155.612 84.5838 157.859C95.5769 160.105 114.401 163.498 128.651 165.775C142.901 168.052 156.231 169.915 165.374 171.052C174.517 172.19 180.304 172.873 188.877 173.691C197.45 174.509 204.068 174.911 210.968 175.538C217.868 176.165 224.548 176.706 231.476 177.21C238.404 177.713 246.311 178.538 256.048 179.009C265.785 179.479 270.534 179.507 281.419 179.848C292.303 180.19 301.628 179.848 312.528 179.848C323.427 179.848 360.257 180.059 376.899 179.848C393.541 179.638 402.884 179.591 419.497 178.969C436.111 178.347 448.194 177.63 466.503 176.33C484.812 175.03 507.982 172.898 525.259 171.052C542.537 169.207 552.23 168.149 569.327 165.775C586.424 163.401 636.897 154.34 636.897 154.34" stroke="#4E6D80" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round"/>
      <path d="M-646.234 180.622C-584.205 184.122 -506.133 182.927 -427.582 180.122C-405.355 180.122 -365.553 180.122 -345.911 180.122C-275.612 180.122 -247.699 180.122 -206.346 180.122C-133.462 178.122 -72.4668 171.712 -45.0707 162.212C20.826 149.065 76.5491 125.712 119 106C148.5 93 176.5 78.5 189.5 73.4997C217 61 225.5 57 264.5 42C303.5 27 343.575 19.6882 392.5 28.4999C401.5 30.1208 423.355 36 440.5 44C454.5 49.5 474.35 62.2714 489 75C517.5 96.5 539.248 120.546 554 132.5C568 145 580.729 152.5 589 157.5C607.609 167 627.5 170.5 639 169.5C639 407.5 -646.234 406.123 -646.234 180.622Z" fill="url(#paint2_luteal)"/>
      <path d="M-642.078 178.85C-622.023 178.85 -610.78 178.85 -590.725 178.85C-563.221 178.85 -547.801 178.85 -520.297 178.85C-476.75 178.85 -452.335 178.85 -408.788 178.85C-353.207 178.85 -322.045 179.18 -266.466 178.85C-229.793 178.633 -209.186 179.768 -172.562 177.925C-161.094 177.348 -154.667 176.945 -143.218 176.076C-127.722 174.9 -119.01 174.353 -103.602 172.377C-84.5629 169.934 -73.9615 167.944 -55.1835 164.054C-38.4453 160.586 -29.0993 158.4 -12.6337 153.881C5.92015 148.789 16.1189 145.251 34.3179 139.084C50.4761 133.609 59.5895 130.633 75.4005 124.288C91.1227 117.978 99.5981 113.688 115.016 106.717C129.964 99.9575 138.259 95.9932 153.164 89.1458C165.765 83.357 172.829 80.1096 185.443 74.3492C195.751 69.6422 201.459 66.8534 211.854 62.3269C224.91 56.6415 232.35 53.7079 245.6 48.4551C255.872 44.3831 261.542 41.8607 272.01 38.2825C282.752 34.6109 288.81 32.5441 299.888 29.9594C310.076 27.5822 315.884 26.4933 326.298 25.3355C340.533 23.7528 348.665 23.7615 362.979 24.4107C373.912 24.9065 380.103 25.2205 390.856 27.185C399.585 28.7797 404.377 30.2063 412.865 32.7338C420.41 34.9805 424.628 36.3293 431.939 39.2073C440.764 42.6813 453.947 49.3799 453.947 49.3799C453.947 49.3799 463.947 55.3503 470.087 59.5526C476.582 63.9978 480.011 66.7727 486.227 71.5748C494.404 77.8931 498.914 81.5326 506.768 88.221C517.4 97.2756 533.178 112.265 533.178 112.265L556.654 133.536C556.654 133.536 571.927 146.542 583.064 152.956C590.222 157.078 594.354 159.322 602.138 162.204C608.795 164.668 613.778 165.991 619.678 167.099C625.578 168.207 627.208 168.462 632.094 168.677C634.718 168.793 638.819 168.677 638.819 168.677" stroke="#A14139" strokeOpacity="0.4" strokeWidth="2" strokeMiterlimit="1.41421" strokeLinecap="round"/>
      <path d="M615 159C606.729 160.5 586.5 164 578 165.5C564.043 167 544.973 170.167 530.5 171.5C497.935 174.5 448.2 180 411.5 180C325.176 180 278.5 182.5 239.5 178.5C222.833 176.35 186.06 174.61 172 172.5C112.039 163.5 93.8551 161 83 158.5C79.3816 157.667 48.5 151 42 149.5C-22.5 134.615 -24.5781 119.5 -42.0781 118.5C-63.0781 119 -72.8796 137.561 -97.0781 154.5C-122.078 172 -151.276 165 -164.198 165C-223.578 155.5 -371.064 141.5 -402.078 141.5C-451.078 139 -537.742 144.5 -578.578 150.5C-598.221 154 -624.246 161.5 -632 164.5C-632 390.001 651.999 390.5 651.999 152.5C642.08 153.211 637 156 632 156C626.677 157.5 620.169 158.5 615 159Z" fill="url(#paint3_luteal)"/>
      <path d="M574 172C560.856 171 523.5 162 510.5 158.5C495.158 154.815 471.563 147.385 446.5 139.5C420 132 380 117.915 344.5 112C294 103 241.5 115 181 135C173.325 137.64 137.201 147.791 130.5 150C42.5 172.5 28.5216 180.779 -34.5 86.5C-35.8826 84.4318 -34.5836 74.1573 -36.0269 71.9999C-56.7535 37.4999 -67.3697 11 -83.5466 10C-99.7236 10 -135.111 50 -165.442 68C-271.603 143 -297.891 139 -356.532 151C-394.715 158.813 -451.572 168.631 -479.376 171.5C-527.722 176.49 -563.482 176.293 -601.193 176.085C-608.829 176.043 -616.546 176 -624.463 176C-624.463 401.501 640 414.5 640 176.5C630.299 177.211 604.308 175.309 590.669 173.965C585.118 173.418 579.011 172.381 574 172Z" fill="url(#paint4_luteal)"/>
      <path d="M-645.195 175.853C-645.195 175.853 -618.382 175.853 -604.028 175.853C-589.673 175.853 -581.616 176.183 -567.271 175.853C-552.925 175.523 -543.03 175.026 -527.573 173.949C-512.117 172.871 -499.642 171.509 -486.406 170.139C-473.17 168.768 -465.29 167.982 -452.59 166.329C-439.889 164.676 -432.771 163.704 -420.244 161.567C-407.717 159.43 -396.989 156.829 -382.016 153.948C-367.044 151.067 -354.924 149.552 -340.849 146.329C-326.774 143.105 -318.531 140.842 -305.562 136.804C-292.594 132.767 -285.381 130.353 -273.216 125.376C-261.051 120.398 -250.728 115.19 -239.4 109.185C-228.072 103.179 -222.12 99.4956 -211.465 92.9935C-200.809 86.4915 -189.022 79.0967 -180.589 72.9929C-172.157 66.8891 -164.921 61.9771 -156.785 55.707C-148.648 49.4369 -141.263 44.2742 -132.985 37.8122C-124.707 31.3501 -119.016 26.8763 -113.324 22.4026C-107.633 17.929 -98.0998 10.0927 -90.9024 11.0861C-83.7051 12.0795 -78.3801 18.0185 -75.038 22.4027C-71.6958 26.7869 -69.1655 31.4179 -64.5927 38.4061C-58.7279 47.3689 -55.5101 52.5131 -50.1293 61.7524C-43.8572 72.5221 -40.4855 78.6552 -33.5997 89.0725C-26.215 100.244 -21.9558 106.477 -13.4542 116.889C-3.92574 128.559 6.74613 139.269 12.8898 145.203C19.0335 151.136 24.0202 154.459 31.1303 157.758C38.2403 161.056 43.1046 162.713 51.7141 163.472C60.3236 164.231 69.6409 163.126 78.1742 162.065C86.7075 161.005 95.7795 158.274 109.055 154.9C122.33 151.527 136.099 147.16 148.752 143.471C161.406 139.783 168.481 137.688 181.098 133.947C193.715 130.206 207.475 125.495 219.325 122.518C231.175 119.541 241.356 116.323 253.501 113.895C265.646 111.468 272.211 110.593 286.958 109.185C301.705 107.776 316.319 107.776 331.066 109.185C345.813 110.593 354.26 112.716 367.823 115.851C381.385 118.986 388.454 121.624 401.639 125.376C414.824 129.127 428.577 132.883 441.336 136.804C454.096 140.726 460.778 143.564 473.683 147.281C486.587 150.998 495.605 153.722 508.778 157.124C521.951 160.526 534.764 163.668 547.196 166.329C559.628 168.991 566.739 170.269 579.542 172.044C592.346 173.818 614.399 175.691 620.71 175.853C627.021 176.016 636.883 175.853 636.883 175.853" stroke="#EFA910" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"/>
    </g>
    <defs>
      <linearGradient id="paint0_luteal" x1="-626.424" y1="18.4999" x2="-629.81" y2="221.004" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#677344" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint1_luteal" x1="-622.29" y1="1.99986" x2="-625.675" y2="204.504" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#4E6D80" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint2_luteal" x1="-646.234" y1="25.5205" x2="-646.234" y2="180.02" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#A14139" stopOpacity="0.5"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint3_luteal" x1="-603.078" y1="49" x2="-613.729" y2="204.512" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#4E6D80" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint4_luteal" x1="-650.75" y1="9.99988" x2="-654.212" y2="212.501" gradientUnits="userSpaceOnUse">
        <stop offset="0.05" stopColor="#EFA910" stopOpacity="0.6"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <clipPath id="clip0_luteal">
        <path d="M0 0H640V191C640 195.418 636.418 199 632 199H7.99999C3.58171 199 0 195.418 0 191V0Z" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const PhaseChart: React.FC<PhaseChartProps> = ({ phaseType }) => {
  return (
    <div className="h-[199px] w-full">
      {phaseType === "luteal" ? <LutealHormonesSvg /> : <FollicularHormonesSvg />}
    </div>
  );
};

interface HormoneCycleChartProps {
  cyclePosition: CyclePositionDto | null;
  onPeriodLogged: (updated: CyclePositionDto) => void;
}

export const HormoneCycleChart: React.FC<HormoneCycleChartProps> = ({ cyclePosition, onPeriodLogged }) => {
  const [isLogPeriodOpen, setIsLogPeriodOpen] = React.useState(false);
  const [periodRange, setPeriodRange] = React.useState<DateRange | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Graceful fallback when cycle tracking is not enabled (DoNotTrack users)
  if (!cyclePosition) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>Cycle tracking is not enabled. Update your profile to see hormone cycle visualization.</p>
      </div>
    );
  }

  const { cycleLength, currentDayInCycle, daysUntilNextPeriod } = cyclePosition;
  const { ovulatoryEnd, follicularDays, ovulatoryDays, lutealDays } = computePhaseBoundaries(cycleLength);
  const hormoneData = generateHormoneData(cycleLength);

  // Split at ovulatoryEnd with one-day overlap for chart continuity
  const follicularData = hormoneData.slice(0, ovulatoryEnd);
  const lutealData = hormoneData.slice(ovulatoryEnd - 1);

  // Overlay widths as percentages of the left (follicular) chart
  const menstrualPct = (5 / ovulatoryEnd) * 100;
  const ovulationPct = (ovulatoryDays / ovulatoryEnd) * 100;

  const formatDate = (date: Date): string => {
    // Use call() to ensure proper this binding and avoid "Illegal invocation" errors
    return Date.prototype.toLocaleDateString.call(date, "en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const handleLogPeriod = async () => {
    if (!periodRange?.from) return;

    const startDate = periodRange.from;
    const endDate = periodRange.to || periodRange.from;

    try {
      setIsSubmitting(true);
      const response = await api.post<ReportPeriodRequest, ReportPeriodResponse>("/api/cycle/report", {
        periodStartDate: Date.prototype.toISOString.call(startDate),
        periodEndDate: Date.prototype.toISOString.call(endDate),
      });

      if (response.success && response.updatedCyclePosition) {
        onPeriodLogged(response.updatedCyclePosition);
      }

      setIsLogPeriodOpen(false);
      setPeriodRange(undefined);
    } catch (err) {
      console.error("Failed to log period:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full lg:w-[85%] mx-auto bg-gradient-to-b from-muted to-background border border-border p-3 rounded-[8px] shadow-[1px_1px_24px_0px_rgba(69,66,58,0.04)]">
      <div className="bg-card border border-border rounded-[6px] py-6 w-full">
        <div className="flex flex-col gap-6 w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 w-full">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-normal leading-7 font-['Petrona'] text-foreground">
                Today is {formatDate(new Date())}
              </h2>
              <div className="flex gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-[6px]">
                  <span className="font-manrope text-xs font-normal leading-4 text-[#696863]">Cycle Day</span>
                  <span className="font-petrona text-2xl font-normal leading-7 text-[#3D3826]">{currentDayInCycle}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-[6px]">
                  <span className="font-manrope text-xs font-normal leading-4 text-[#696863]">Next Period in</span>
                  <span className="font-petrona text-2xl font-normal leading-7 text-[#3D3826]">{daysUntilNextPeriod} Days</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsLogPeriodOpen(true)}
              className="flex items-center justify-center gap-2 h-10 px-6 py-2.5 bg-[#45423a] text-background text-base font-medium leading-6 rounded-[6px] shadow-[inset_0px_2px_3px_0px_#3d3826] hover:bg-[#45423a]/90"
            >
              <CalendarDays className="h-4 w-4" />
              Log Period
            </Button>
          </div>

          {/* Phase Charts Container */}
          <div className="flex flex-col gap-2 w-full">
            <div className="relative flex gap-2 px-3 w-full">
              {/* Follicular Phase Container */}
              <div className="relative w-1/2 border border-border rounded-[6px] bg-card overflow-hidden">
                {/* Follicular Phase Header */}
                <div className="flex h-7 border-b border-border bg-card relative z-10">
                  {/* Menstruation */}
                  <div
                    className="bg-[rgba(78,109,128,0.6)] px-2 py-1.5 flex items-center justify-center gap-1.5 rounded-tl-[6px]"
                    style={{ width: `${menstrualPct}%` }}
                  >
                    <Snowflake className="w-3.5 h-3.5 text-[#29271b] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#29271b] whitespace-nowrap">Menstruation</span>
                  </div>

                  {/* Follicular Phase */}
                  <div className="flex-1 flex items-center justify-center px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 flex-shrink-0" />
                      <span className="font-manrope text-sm font-medium leading-5 text-[#45423A]">Follicular Phase</span>
                      <Badge variant="secondary" className="font-manrope text-xs font-normal h-5 px-2 bg-[#F3F0E7] hover:bg-[#F3F0E7] text-[#45423A] border-0">
                        {follicularDays} Days
                      </Badge>
                    </div>
                  </div>

                  {/* Ovulation */}
                  <div
                    className="bg-[rgba(217,119,6,0.7)] px-2 py-1.5 flex items-center justify-center gap-1.5 border-l border-dashed border-[rgba(217,119,6,0.2)] rounded-tr-[6px]"
                    style={{ width: `${ovulationPct}%` }}
                  >
                    <Sun className="w-3.5 h-3.5 text-[#29271b] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#29271b] whitespace-nowrap">Ovulation</span>
                  </div>
                </div>

                {/* Follicular Phase Chart */}
                <PhaseChart data={follicularData} phaseType="follicular" />

                {/* Menstruation Overlay */}
                <div
                  className="absolute left-0 top-7 bottom-0 rounded-bl-[6px]"
                  style={{ width: `${menstrualPct}%`, backgroundColor: "rgba(78,109,128,0.1)" }}
                >
                  <svg className="absolute right-0 top-0 h-full w-[1px]" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(78,109,128,0.2)" strokeWidth="1" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <Badge variant="secondary" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-manrope text-xs font-normal h-auto py-1 px-2 bg-[#4E6D80] hover:bg-[#4E6D80] text-white backdrop-blur-sm border-0 whitespace-nowrap">
                    3-7 Days
                  </Badge>
                </div>

                {/* Ovulation Overlay */}
                <div
                  className="absolute right-0 top-7 bottom-0 rounded-br-[6px]"
                  style={{ width: `${ovulationPct}%`, backgroundColor: "rgba(227,146,25,0.1)" }}
                >
                  <svg className="absolute left-0 top-0 h-full w-[1px]" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(217,119,6,0.2)" strokeWidth="1" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <Badge variant="secondary" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-manrope text-xs font-normal h-auto py-1 px-2 bg-[#D97706] hover:bg-[#D97706] text-white backdrop-blur-sm border-0 whitespace-nowrap">
                    1-2 Days
                  </Badge>
                </div>
              </div>

              {/* Luteal Phase Container */}
              <div className="relative w-1/2 border border-border rounded-[6px] bg-card overflow-hidden">
                {/* Luteal Phase Header */}
                <div className="flex h-7 border-b border-border bg-card relative z-10">
                  <div className="w-full flex items-center justify-center px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 flex-shrink-0" />
                      <span className="font-manrope text-sm font-medium leading-5 text-[#45423A]">Luteal Phase</span>
                      <Badge variant="secondary" className="font-manrope text-xs font-normal h-5 px-2 bg-[#F3F0E7] hover:bg-[#F3F0E7] text-[#45423A] border-0">
                        {lutealDays} Days
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Luteal Phase Chart */}
                <PhaseChart data={lutealData} phaseType="luteal" />
              </div>
            </div>

            {/* Cycle Days */}
            <div className="flex items-center justify-between px-3 w-full">
              {Array.from({ length: cycleLength }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={cn(
                    "flex-1 flex items-center justify-center text-xs font-normal leading-4 text-[#696863] text-center",
                    day === currentDayInCycle && "bg-card rounded-[6px]"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.estrogen }} />
                <span className="text-sm text-[#696863] font-normal">Estrogen</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.progesterone }} />
                <span className="text-sm text-[#696863] font-normal">Progesterone</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.fsh }} />
                <span className="text-sm text-[#696863] font-normal">FSH (Follicle Stimulating Hormone)</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.lh }} />
                <span className="text-sm text-[#696863] font-normal">LH (Luteinizing Hormone)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Period Dialog */}
      <Dialog open={isLogPeriodOpen} onOpenChange={setIsLogPeriodOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Period</DialogTitle>
            <DialogDescription>
              Select the date your period started. You can also select a range if it has already ended.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            <Calendar
              mode="range"
              selected={periodRange}
              onSelect={setPeriodRange}
              disabled={{ after: new Date() }}
              className="rounded-md border"
            />
            {periodRange?.from && (
              <div className="mt-4 p-3 bg-muted rounded-[6px] text-sm w-full">
                <strong>Selected Period:</strong>{' '}
                {periodRange.from.toLocaleDateString()}
                {periodRange.to && periodRange.to.getTime() !== periodRange.from.getTime() && (
                  <> - {periodRange.to.toLocaleDateString()}</>
                )}
                {!periodRange.to && (
                  <span className="text-muted-foreground"> (single day)</span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogPeriodOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleLogPeriod}
              disabled={!periodRange?.from || isSubmitting}
            >
              {isSubmitting ? "Logging..." : "Log Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HormoneCycleChart;
