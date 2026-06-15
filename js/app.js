/* ============================================================
   如意小天气 PWA — Open-Meteo 免费 API
   境内直连可用，无需任何 Key
   ============================================================ */

// ---- DOM ----
const $ = s => document.querySelector(s);
const dom = {
  loader: $(".loading"), main: $(".main-content"), error: $(".error-msg"),
  errBtn: $(".error-msg button"), locName: $(".loc-name"),
  greeting: $("#greeting"), icon: $(".now-right .icon"),
  temp: $(".now-left .temp"), desc: $(".now-left .desc"),
  feels: $(".now-left .feels"), wind: $("#wind"),
  humidity: $("#humidity"), visibility: $("#visibility"),
  airBadge: $("#air-badge"), airInfo: $("#air-info"),
  motto: $("#motto"), forecastList: $(".forecast-list"),
  cityOverlay: $(".city-overlay"), cityInput: $(".city-overlay input"),
  cityOk: $("#city-ok"), cityCancel: $("#city-cancel"),
  pushToggle: $(".toggle"), toast: $(".toast"),
};

let city = { name: "北京", lat: 39.9042, lon: 116.4074 };

// ---- WMO codes ----
const WMO = { "0":"☀️晴","1":"🌤️晴","2":"⛅多云","3":"☁️阴","45":"🌫️雾","48":"🌫️雾凇","51":"🌦️毛毛雨","53":"🌦️毛毛雨","55":"🌦️毛毛雨","61":"🌧️小雨","63":"🌧️中雨","65":"🌧️大雨","71":"🌨️小雪","73":"🌨️中雪","75":"❄️大雪","77":"🌨️雪粒","80":"🌧️阵雨","81":"🌧️阵雨","82":"⛈️大阵雨","85":"🌨️阵雪","86":"🌨️阵雪","95":"⛈️雷暴","96":"⛈️冰雹","99":"⛈️大冰雹" };
const WD = ["北","东北","东","东南","南","西南","西","西北"];

function wm(c) { const s = WMO[String(c)]; return s ? [s.slice(0,2), s.slice(2)] : ["🌈","未知"]; }

// ---- Motto ----
const MOTTOS = [
  "如意要开心 🌼", "今天的你也是闪闪发光的 ✨", "风会记得每一朵花的香 🌸",
  "生活明朗，万物可爱 ☀️", "慢慢来，好运都在路上 🍃", "保持热爱，奔赴山海 🌊",
  "心之所向，皆是暖阳 💛", "人间值得，你也值得 🎈", "万物皆有裂痕，那是光照进来的地方 🌤️",
  "今天也要好好爱自己 🧸", "所有美好都会如期而至 🌈", "不要急，最好的总是在不经意间出现 🌿",
];
const WX_MOTTOS = {
  rain: ["雨天最适合理直气壮地发呆，如意要开心。","下雨的时候，世界会安静下来听你说话。"],
  snow: ["雪落在肩上，世界忽然安静，如意要开心。","每一片雪花都是天空写给你的情书。"],
  sun: ["晴空万里，把烦恼也拿出来晒一晒，如意要开心。","阳光很好，你也要很好。"],
  cloud: ["有光有云的日子，一切都刚刚好，如意要开心。"],
  fog: ["雾里看花，看不清的时候反而最真，如意要开心。"],
  storm: ["雷声再大也是会停的，如意要开心。"],
  hot: ["热浪滚滚，记得给自己买杯冷饮降降温。"],
  cold: ["天冷就抱紧自己，温暖从心开始。"],
  nice: ["温度刚好，不辜负这人间好时节。"],
  clean: ["空气清新得像刚洗过的衬衫。"],
};

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function getMotto(code, temp, aqi) {
  const ms = [];
  if (code>=61 && code<=99) ms.push(...WX_MOTTOS.rain);
  else if (code>=71 && code<=86) ms.push(...WX_MOTTOS.snow);
  else if (code===0) ms.push(...WX_MOTTOS.sun);
  else if (code>=1 && code<=2) ms.push(...WX_MOTTOS.cloud);
  else if (code>=45 && code<=48) ms.push(...WX_MOTTOS.fog);
  else if (code>=95) ms.push(...WX_MOTTOS.storm);
  else ms.push("不管什么天气，如意要开心 🌈");
  if (temp>=35) ms.push(...WX_MOTTOS.hot);
  else if (temp<=0) ms.push(...WX_MOTTOS.cold);
  else if (temp>=20 && temp<=26) ms.push(...WX_MOTTOS.nice);
  if (aqi===1) ms.push(...WX_MOTTOS.clean);
  return pick(ms);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h<6) return "夜深了，星星陪你醒着，如意要开心 ✨";
  if (h<9) return "早安，又是崭新的一天，如意要开心 ☀️";
  if (h<12) return "上午好，如意小天气在呢 🌿";
  if (h<14) return "午后阳光正暖，休息一下，如意要开心 🍵";
  if (h<18) return "下午好，喝杯茶吧，如意要开心 ☕";
  if (h<21) return "黄昏把影子拉得很长，如意要开心 🍂";
  return "晚安，明天会更好，如意要开心 🌙";
}

// ---- API ----
async function fet(url) { const r = await fetch(url); if (!r.ok) throw Error(`HTTP ${r.status}`); return r.json(); }

async function reverseGeo(lat, lon) {
  try {
    const d = await fet(`https://geocoding-api.open-meteo.com/v1/search?name=&count=1&language=zh&latitude=${lat}&longitude=${lon}`);
    if (d.results && d.results[0]) return d.results[0].name || "我的位置";
  } catch {}
  return null;
}

async function searchCity(q) {
  const d = await fet(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=3&language=zh`);
  if (d.results && d.results.length>0) return { name: d.results[0].name, lat: d.results[0].latitude, lon: d.results[0].longitude };
  return null;
}

async function loadWx(c) {
  const [w,a] = await Promise.all([
    fet(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai&forecast_days=5`),
    fet(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lon}&current=european_aqi,pm2_5,pm10`).catch(()=>null),
  ]);
  render(c, w, a);
}

// ---- render ----
function render(c, w, a) {
  const cur = w.current;
  const temp = Math.round(cur.temperature_2m);
  const code = String(cur.weather_code);
  const [ico, desc] = wm(code);
  const aqi = a?.current?.european_aqi;
  const aqiLabels = ["","优","良","一般","较差","差"];
  const aqiLabel = aqi ? aqiLabels[aqi]||"未知" : null;

  dom.locName.textContent = c.name;
  dom.greeting.textContent = getGreeting();
  dom.icon.textContent = ico;
  dom.temp.textContent = temp + "°";
  dom.desc.textContent = desc;
  dom.feels.textContent = "体感 " + Math.round(cur.apparent_temperature) + "°C";
  dom.wind.textContent = WD[Math.round(cur.wind_direction_10m/45)%8] + " " + cur.wind_speed_10m + "km/h";
  dom.humidity.textContent = cur.relative_humidity_2m + "%";
  dom.visibility.textContent = (cur.visibility&&cur.visibility<99000) ? (cur.visibility/1000).toFixed(1)+"km" : ">10km";
  dom.motto.textContent = getMotto(parseInt(code), temp, aqi);

  if (aqiLabel) {
    dom.airBadge.textContent = aqiLabel;
    dom.airBadge.className = "air-badge " + (aqi<=2?"good":aqi<=3?"ok":"bad");
    dom.airInfo.textContent = `AQI ${aqi} · PM2.5 ${a.current.pm2_5} · PM10 ${a.current.pm10}`;
  }

  dom.forecastList.innerHTML = "";
  const wd = ["周日","周一","周二","周三","周四","周五","周六"];
  for (let i=0;i<Math.min(5,w.daily.time.length);i++) {
    const d = new Date(w.daily.time[i]+"T00:00:00+08:00");
    const [fi, fd] = wm(String(w.daily.weather_code[i]));
    const isToday = i===0;
    const el = document.createElement("div"); el.className = "forecast-item" + (isToday?" today":"");
    el.innerHTML = `<div class="fc-left"><span class="day">${isToday?"今天":wd[d.getDay()]}</span><span class="fc-desc">${fd}</span></div><span class="fc-icon">${fi}</span><span class="fc-temp">${Math.round(w.daily.temperature_2m_max[i])}° <span class="fc-lo">${Math.round(w.daily.temperature_2m_min[i])}°</span></span>`;
    dom.forecastList.appendChild(el);
  }
  showMain();
}

// ---- init ----
async function load() {
  showLoader();
  try {
    let c = city;
    const s = localStorage.getItem("weather_city");
    if (s) { c = JSON.parse(s); }
    else {
      c = await gpsCity() || c;
    }
    city = c;
    await loadWx(c);
  } catch(e) { console.error(e); showError("加载失败，请检查网络后重试"); }
}

function gpsCity() {
  return new Promise(res => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(async p => {
      const n = await reverseGeo(p.coords.latitude, p.coords.longitude);
      if (n) { const c = { name:n, lat:p.coords.latitude, lon:p.coords.longitude }; localStorage.setItem("weather_city", JSON.stringify(c)); res(c); }
      else res(null);
    }, ()=>res(null), {timeout:8000});
  });
}

function showLoader() { dom.loader.style.display="block"; dom.main.style.display="none"; dom.error.style.display="none"; }
function showMain() { dom.loader.style.display="none"; dom.main.style.display="block"; dom.error.style.display="none"; }
function showError(msg) { dom.loader.style.display="none"; dom.main.style.display="none"; dom.error.style.display="block"; dom.error.querySelector("p").textContent = msg; }

// city picker
dom.locName.onclick = () => { dom.cityOverlay.classList.remove("hidden"); dom.cityInput.value=""; setTimeout(()=>dom.cityInput.focus(),100); };
dom.cityCancel.onclick = () => dom.cityOverlay.classList.add("hidden");
dom.cityOk.onclick = async () => {
  const n = dom.cityInput.value.trim(); if (!n) return;
  dom.cityOverlay.classList.add("hidden"); showLoader();
  const c = await searchCity(n);
  if (c) { city=c; localStorage.setItem("weather_city",JSON.stringify(c)); await loadWx(c); toast("已切换"); }
  else showError(`未找到"${n}"`);
};
dom.cityInput.onkeydown = e => { if (e.key==="Enter") dom.cityOk.click(); };
dom.errBtn.onclick = () => load();

// push
dom.pushToggle.onclick = () => {
  const on = dom.pushToggle.classList.toggle("on");
  localStorage.setItem("push_enabled", on?"1":"0");
  if (on) reqNotif(); else toast("推送已关闭");
};
function reqNotif() {
  if (!("Notification" in window)) return toast("不支持通知");
  if (Notification.permission==="granted") { toast("早安提醒已开启(早8点) ✨"); sched(); return; }
  if (Notification.permission==="denied") { toast("通知已禁用"); dom.pushToggle.classList.remove("on"); return; }
  Notification.requestPermission().then(p => { if (p==="granted") { toast("早安提醒已开启(早8点) ✨"); sched(); } else { toast("权限被拒绝"); dom.pushToggle.classList.remove("on"); } });
}
function sched() {
  const n=new Date(), t=new Date(n); t.setHours(8,0,0,0); if (t<=n) t.setDate(t.getDate()+1);
  setTimeout(() => {
    if (Notification.permission==="granted") {
      const m = pick(MOTTOS);
      new Notification(`☀️ ${city.name}今日天气`, { body: `点我查看天气详情 · ${m}`, icon:"icons/icon-192.png" });
    }
    sched();
  }, Math.min(t-n,86400000));
}
function toast(m) { dom.toast.textContent=m; dom.toast.classList.remove("hidden"); setTimeout(()=>dom.toast.classList.add("hidden"),2500); }

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
if (localStorage.getItem("push_enabled")==="1") dom.pushToggle.classList.add("on");
load();
