/**
 * VR Social Identity & Rich Content — Set 16
 *
 *  1. Avatar/Profile System    — name, avatar emoji, profile card
 *  2. Leaderboard              — achievements/sessions/exploration ranking
 *  3. Event Reminders          — schedule countdown alerts per event
 *  4. Movie Trivia Quiz        — random trivia questions (Movies zone)
 *  5. Stock News Feed          — simulated market headlines (Stocks zone)
 *  6. Wellness Journal         — mood tracker + notes with history
 *  7. Weather Outfit Suggest   — clothing recommendation from forecast
 *  8. Creator Discovery Quiz   — personality-match quiz (Creators zone)
 *  9. Hub World Map            — interactive canvas globe with markers
 * 10. Progress Milestones      — milestone badges at usage thresholds
 *
 * Load via <script src="/vr/social-rich.js"></script>
 */
(function () {
  'use strict';
  function detectZone() {
    var p = location.pathname;
    if (p.indexOf('/vr/events') !== -1) return 'events';
    if (p.indexOf('/vr/movies') !== -1) return 'movies';
    if (p.indexOf('/vr/creators') !== -1) return 'creators';
    if (p.indexOf('/vr/stocks') !== -1) return 'stocks';
    if (p.indexOf('/vr/wellness') !== -1) return 'wellness';
    if (p.indexOf('/vr/weather') !== -1) return 'weather';
    if (p.indexOf('/vr/tutorial') !== -1) return 'tutorial';
    return 'hub';
  }
  var zone = detectZone();
  function store(k,v){try{localStorage.setItem('vr16_'+k,JSON.stringify(v))}catch(e){}}
  function load(k,d){try{var v=localStorage.getItem('vr16_'+k);return v?JSON.parse(v):d}catch(e){return d}}
  function css(id,t){if(document.getElementById(id))return;var s=document.createElement('style');s.id=id;s.textContent=t;document.head.appendChild(s)}
  function toast(m,c){c=c||'#7dd3fc';var t=document.createElement('div');t.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9500;background:rgba(15,12,41,0.95);color:'+c+';padding:10px 20px;border-radius:10px;font:600 13px/1.3 Inter,system-ui,sans-serif;border:1px solid '+c+'33;backdrop-filter:blur(10px);pointer-events:none;animation:vr16t .3s ease-out';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s'},2500);setTimeout(function(){if(t.parentNode)t.remove()},3000)}
  css('vr16-base','@keyframes vr16t{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}');

  /* ═══════════════════════════════════════════════
     1. AVATAR / PROFILE SYSTEM
     ═══════════════════════════════════════════════ */
  var profile = (function(){
    var data = load('profile',{name:'Explorer',avatar:'🧑‍🚀',title:'VR Newcomer',joined:Date.now()});
    var avatars = ['🧑‍🚀','🦸','🧙','🤖','👽','🐱','🦊','🐉','🎮','🌟'];

    function openEditor(){
      var el=document.getElementById('vr16-profile');if(el){el.remove();return;}
      css('vr16-prof-css','#vr16-profile{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:700;background:rgba(15,12,41,0.97);border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:24px;width:min(320px,90vw);color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)} .vr16-avatar-opt{display:inline-block;font-size:28px;padding:4px;cursor:pointer;border-radius:8px;border:2px solid transparent;transition:all .15s} .vr16-avatar-opt:hover,.vr16-avatar-opt.sel{border-color:rgba(168,85,247,0.5);background:rgba(168,85,247,0.1)}');
      el=document.createElement('div');el.id='vr16-profile';el.setAttribute('role','dialog');
      var html='<h3 style="margin:0 0 12px;color:#c4b5fd;font-size:16px">'+data.avatar+' My Profile</h3>';
      html+='<label style="font-size:11px;color:#94a3b8">Display Name</label><input id="vr16-name" value="'+data.name.replace(/"/g,'&quot;')+'" style="width:100%;padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(168,85,247,0.2);border-radius:6px;color:#e2e8f0;font:13px Inter,sans-serif;margin-bottom:10px;outline:none">';
      html+='<label style="font-size:11px;color:#94a3b8">Avatar</label><div style="margin:6px 0 12px">';
      avatars.forEach(function(a){html+='<span class="vr16-avatar-opt'+(a===data.avatar?' sel':'')+'" onclick="VRSocialRich.profile.setAvatar(\''+a+'\')">'+a+'</span>';});
      html+='</div>';
      html+='<button onclick="VRSocialRich.profile.saveName(document.getElementById(\'vr16-name\').value);document.getElementById(\'vr16-profile\').remove()" style="width:100%;padding:7px;background:rgba(168,85,247,0.1);color:#c4b5fd;border:1px solid rgba(168,85,247,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,sans-serif">Save & Close</button>';
      el.innerHTML=html;document.body.appendChild(el);
    }
    function saveName(n){data.name=n||'Explorer';store('profile',data);toast('Profile updated!','#a855f7');}
    function setAvatar(a){data.avatar=a;store('profile',data);document.querySelectorAll('.vr16-avatar-opt').forEach(function(e){e.classList.toggle('sel',e.textContent===a)});toast('Avatar: '+a,'#a855f7');}
    function getProfile(){return Object.assign({},data);}
    return {open:openEditor,saveName:saveName,setAvatar:setAvatar,get:getProfile};
  })();

  /* ═══════════════════════════════════════════════
     2. LEADERBOARD
     ═══════════════════════════════════════════════ */
  var leaderboard = (function(){
    function getScore(){
      var score=0;
      try{var ach=JSON.parse(localStorage.getItem('vr10_achievements')||'[]');score+=ach.length*10;}catch(e){}
      try{var sess=JSON.parse(localStorage.getItem('vr12_sessions')||'[]');score+=sess.length*2;}catch(e){}
      try{var zones=JSON.parse(localStorage.getItem('vr13_challenge_'+new Date().toISOString().slice(0,10))||'{}');if(zones.completed)score+=50;}catch(e){}
      try{score+=load('pomodoro_sessions',0)*5;}catch(e){}
      return score;
    }
    var entries=load('leaderboard',[]);
    function updateEntry(){
      var p=profile.get();var s=getScore();
      var existing=entries.find(function(e){return e.name===p.name;});
      if(existing){existing.score=Math.max(existing.score,s);existing.avatar=p.avatar;existing.time=Date.now();}
      else{entries.push({name:p.name,avatar:p.avatar,score:s,time:Date.now()});}
      entries.sort(function(a,b){return b.score-a.score;});
      if(entries.length>20)entries=entries.slice(0,20);
      store('leaderboard',entries);
    }
    function openBoard(){
      updateEntry();
      var el=document.getElementById('vr16-leaderboard');if(el){el.remove();return;}
      css('vr16-lb-css','#vr16-leaderboard{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:700;background:rgba(15,12,41,0.97);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:20px;width:min(340px,90vw);max-height:60vh;overflow-y:auto;color:#e2e8f0;font:12px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)} .vr16-lb-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)} .vr16-lb-rank{font:700 14px Inter,sans-serif;min-width:24px;color:#fbbf24}');
      el=document.createElement('div');el.id='vr16-leaderboard';el.setAttribute('role','dialog');
      var html='<h3 style="margin:0 0 12px;color:#fbbf24;font-size:16px">🏆 Leaderboard</h3>';
      entries.slice(0,10).forEach(function(e,i){
        var medals=['🥇','🥈','🥉'];
        html+='<div class="vr16-lb-row"><span class="vr16-lb-rank">'+(medals[i]||(i+1))+'</span><span>'+e.avatar+'</span><span style="flex:1">'+e.name+'</span><span style="color:#fbbf24;font-weight:700">'+e.score+'</span></div>';
      });
      html+='<button onclick="document.getElementById(\'vr16-leaderboard\').remove()" style="margin-top:10px;width:100%;padding:6px;background:rgba(245,158,11,0.1);color:#fbbf24;border:1px solid rgba(245,158,11,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,sans-serif">Close</button>';
      el.innerHTML=html;document.body.appendChild(el);
    }
    setTimeout(updateEntry,3000);
    return {open:openBoard,getScore:getScore,getEntries:function(){return entries;}};
  })();

  /* ═══════════════════════════════════════════════
     3. EVENT REMINDERS
     ═══════════════════════════════════════════════ */
  var eventReminders = (function(){
    if(zone!=='events')return null;
    var reminders=load('reminders',[]);
    function addReminder(eventId,title,dateStr){
      if(reminders.some(function(r){return r.eventId===eventId;}))return;
      reminders.push({eventId:eventId,title:title,date:dateStr||new Date(Date.now()+86400000).toISOString(),set:Date.now()});
      store('reminders',reminders);toast('⏰ Reminder set: '+title,'#f59e0b');
    }
    function removeReminder(eventId){reminders=reminders.filter(function(r){return r.eventId!==eventId;});store('reminders',reminders);}
    function checkReminders(){
      var now=Date.now();
      reminders.forEach(function(r){
        var d=new Date(r.date).getTime();
        if(d-now<3600000&&d-now>0&&!r.notified){r.notified=true;store('reminders',reminders);toast('⏰ Coming up: '+r.title,'#ef4444');}
      });
    }
    setInterval(checkReminders,30000);
    return {add:addReminder,remove:removeReminder,getAll:function(){return reminders;}};
  })();

  /* ═══════════════════════════════════════════════
     4. MOVIE TRIVIA QUIZ
     ═══════════════════════════════════════════════ */
  var movieTrivia = (function(){
    if(zone!=='movies')return null;
    var questions=[
      {q:'Which 1994 film features a prison escape through a sewer?',a:'The Shawshank Redemption',opts:['The Shawshank Redemption','The Green Mile','Escape from Alcatraz','Papillon']},
      {q:'Who directed Inception (2010)?',a:'Christopher Nolan',opts:['Christopher Nolan','Steven Spielberg','Ridley Scott','James Cameron']},
      {q:'What is the highest-grossing film of all time (adjusted)?',a:'Avatar',opts:['Avatar','Avengers: Endgame','Titanic','Star Wars']},
      {q:'Which film features the quote "Here\'s looking at you, kid"?',a:'Casablanca',opts:['Casablanca','Gone with the Wind','The Maltese Falcon','Citizen Kane']},
      {q:'In The Matrix, what color pill does Neo take?',a:'Red',opts:['Red','Blue','Green','Yellow']},
      {q:'Who played the Joker in The Dark Knight?',a:'Heath Ledger',opts:['Heath Ledger','Jack Nicholson','Joaquin Phoenix','Jared Leto']},
      {q:'What year was the first Star Wars film released?',a:'1977',opts:['1977','1980','1975','1983']},
      {q:'Which Pixar film features a rat who wants to cook?',a:'Ratatouille',opts:['Ratatouille','Finding Nemo','Coco','Up']}
    ];
    var current=null;var score=load('trivia_score',0);var answered=0;

    function startQuiz(){
      var el=document.getElementById('vr16-trivia');if(el){el.remove();return;}
      current=questions[Math.floor(Math.random()*questions.length)];
      css('vr16-triv-css','#vr16-trivia{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:700;background:rgba(15,12,41,0.97);border:1px solid rgba(78,205,196,0.3);border-radius:16px;padding:24px;width:min(360px,90vw);color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)} .vr16-triv-opt{display:block;width:100%;padding:8px;margin:4px 0;background:rgba(78,205,196,0.06);border:1px solid rgba(78,205,196,0.15);border-radius:8px;color:#4ecdc4;cursor:pointer;font:600 12px Inter,sans-serif;text-align:left;transition:all .15s} .vr16-triv-opt:hover{background:rgba(78,205,196,0.12);border-color:rgba(78,205,196,0.3)}');
      var el=document.createElement('div');el.id='vr16-trivia';el.setAttribute('role','dialog');
      var shuffled=current.opts.slice().sort(function(){return Math.random()-0.5;});
      var html='<h3 style="margin:0 0 10px;color:#4ecdc4;font-size:15px">🎬 Movie Trivia</h3>';
      html+='<p style="margin:0 0 12px;font-size:13px">'+current.q+'</p>';
      shuffled.forEach(function(o){html+='<button class="vr16-triv-opt" onclick="VRSocialRich.movieTrivia.answer(\''+o.replace(/'/g,"\\'") +'\')">'+o+'</button>';});
      html+='<div style="color:#64748b;font-size:10px;margin-top:8px">Score: '+score+'/'+answered+'</div>';
      el.innerHTML=html;document.body.appendChild(el);
    }
    function answer(a){
      answered++;
      if(a===current.a){score++;store('trivia_score',score);toast('✅ Correct!','#22c55e');}
      else{toast('❌ Wrong! It was: '+current.a,'#ef4444');}
      var el=document.getElementById('vr16-trivia');if(el)el.remove();
    }
    function createButton(){
      css('vr16-triv-btn','#vr16-trivia-btn{position:fixed;bottom:120px;left:10px;z-index:160;background:rgba(15,12,41,0.9);border:1px solid rgba(78,205,196,0.2);border-radius:10px;padding:6px 12px;color:#4ecdc4;font:600 12px Inter,sans-serif;cursor:pointer;backdrop-filter:blur(10px)}#vr16-trivia-btn:hover{border-color:rgba(78,205,196,0.4);color:#fff}');
      var btn=document.createElement('button');btn.id='vr16-trivia-btn';btn.textContent='🎬 Trivia';btn.onclick=startQuiz;document.body.appendChild(btn);
    }
    setTimeout(createButton,2000);
    return {start:startQuiz,answer:answer,getScore:function(){return{score:score,answered:answered};}};
  })();

  /* ═══════════════════════════════════════════════
     5. STOCK NEWS FEED
     ═══════════════════════════════════════════════ */
  var stockNews = (function(){
    if(zone!=='stocks')return null;
    var headlines=[
      {title:'Tech stocks rally on AI earnings beat',ticker:'NVDA',sentiment:'bull',time:Date.now()-3600000},
      {title:'Federal Reserve holds rates steady',ticker:'SPY',sentiment:'neutral',time:Date.now()-7200000},
      {title:'Apple unveils new Vision Pro features',ticker:'AAPL',sentiment:'bull',time:Date.now()-10800000},
      {title:'Oil prices dip on supply surplus',ticker:'XOM',sentiment:'bear',time:Date.now()-14400000},
      {title:'Microsoft Cloud revenue exceeds expectations',ticker:'MSFT',sentiment:'bull',time:Date.now()-18000000},
      {title:'Tesla deliveries miss Q1 target',ticker:'TSLA',sentiment:'bear',time:Date.now()-21600000},
      {title:'Crypto markets stabilize after volatility',ticker:'BTC',sentiment:'neutral',time:Date.now()-25200000},
      {title:'Amazon expands same-day delivery network',ticker:'AMZN',sentiment:'bull',time:Date.now()-28800000}
    ];
    function createFeed(){
      css('vr16-news-css','#vr16-stock-news{position:fixed;top:130px;right:10px;z-index:155;background:rgba(15,12,41,0.92);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:10px 12px;width:200px;max-height:240px;overflow-y:auto;color:#e2e8f0;font:11px/1.4 Inter,system-ui,sans-serif;backdrop-filter:blur(10px)} #vr16-stock-news h4{margin:0 0 6px;color:#22c55e;font-size:12px} .vr16-news-item{padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:10px} .vr16-news-bull{color:#22c55e} .vr16-news-bear{color:#ef4444} .vr16-news-neutral{color:#94a3b8}');
      var el=document.createElement('div');el.id='vr16-stock-news';
      var html='<h4>📰 Market News</h4>';
      headlines.forEach(function(h){
        var cls='vr16-news-'+h.sentiment;
        var ago=Math.round((Date.now()-h.time)/3600000);
        html+='<div class="vr16-news-item"><span class="'+cls+'">●</span> '+h.title+'<div style="color:#475569;font-size:9px">'+h.ticker+' · '+ago+'h ago</div></div>';
      });
      el.innerHTML=html;document.body.appendChild(el);
    }
    setTimeout(createFeed,2000);
    return {getHeadlines:function(){return headlines;}};
  })();

  /* ═══════════════════════════════════════════════
     6. WELLNESS JOURNAL
     ═══════════════════════════════════════════════ */
  var wellnessJournal = (function(){
    if(zone!=='wellness')return null;
    var entries=load('journal',[]);
    var moods=['😊','😐','😔','😤','😴','🥳','😌'];

    function createUI(){
      css('vr16-journal-css','#vr16-journal{position:fixed;top:50px;left:10px;z-index:160;background:rgba(15,12,41,0.92);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:10px 14px;width:200px;color:#e2e8f0;font:11px/1.4 Inter,system-ui,sans-serif;backdrop-filter:blur(10px)} #vr16-journal h4{margin:0 0 6px;color:#10b981;font-size:12px} .vr16-mood-btn{font-size:20px;cursor:pointer;padding:2px;border:2px solid transparent;border-radius:6px;background:none;transition:all .15s} .vr16-mood-btn:hover,.vr16-mood-btn.sel{border-color:rgba(16,185,129,0.4);background:rgba(16,185,129,0.1)}');
      var el=document.createElement('div');el.id='vr16-journal';
      var html='<h4>📓 Mood Journal</h4><div style="margin-bottom:6px">';
      moods.forEach(function(m){html+='<button class="vr16-mood-btn" onclick="VRSocialRich.wellnessJournal.logMood(\''+m+'\')">'+m+'</button>';});
      html+='</div><textarea id="vr16-journal-text" placeholder="How are you feeling?" style="width:100%;height:50px;background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.15);border-radius:6px;color:#e2e8f0;font:11px Inter,sans-serif;padding:4px 6px;resize:none;outline:none"></textarea>';
      html+='<button onclick="VRSocialRich.wellnessJournal.save()" style="margin-top:4px;width:100%;padding:4px;background:rgba(16,185,129,0.08);color:#6ee7b7;border:1px solid rgba(16,185,129,0.2);border-radius:6px;cursor:pointer;font:600 10px Inter,sans-serif">Save Entry</button>';
      html+='<div style="margin-top:6px;color:#64748b;font-size:9px">'+entries.length+' entries logged</div>';
      el.innerHTML=html;document.body.appendChild(el);
    }
    var selectedMood='😊';
    function logMood(m){selectedMood=m;document.querySelectorAll('.vr16-mood-btn').forEach(function(b){b.classList.toggle('sel',b.textContent===m)});toast('Mood: '+m,'#10b981');}
    function save(){
      var ta=document.getElementById('vr16-journal-text');
      entries.push({mood:selectedMood,note:ta?ta.value:'',time:Date.now(),date:new Date().toISOString().slice(0,10)});
      if(entries.length>100)entries=entries.slice(-100);
      store('journal',entries);if(ta)ta.value='';toast('Journal entry saved','#10b981');
    }
    setTimeout(createUI,2000);
    return {logMood:logMood,save:save,getEntries:function(){return entries;},moods:moods};
  })();

  /* ═══════════════════════════════════════════════
     7. WEATHER OUTFIT SUGGESTION
     ═══════════════════════════════════════════════ */
  var weatherOutfit = (function(){
    if(zone!=='weather')return null;
    function suggest(tempC){
      if(tempC<-10)return{outfit:'Heavy winter coat, thermal layers, boots, gloves, hat',icon:'🧥'};
      if(tempC<0)return{outfit:'Winter jacket, warm layers, scarf, gloves',icon:'🧣'};
      if(tempC<10)return{outfit:'Warm jacket, sweater, long pants',icon:'🧤'};
      if(tempC<18)return{outfit:'Light jacket or hoodie, jeans',icon:'🪖'};
      if(tempC<25)return{outfit:'T-shirt, light pants or shorts',icon:'👕'};
      if(tempC<32)return{outfit:'Light, breathable clothing, sunglasses, sunscreen',icon:'🕶️'};
      return{outfit:'Minimal light clothing, stay hydrated, seek shade',icon:'🩳'};
    }
    function createWidget(){
      css('vr16-outfit-css','#vr16-outfit{position:fixed;bottom:50px;left:10px;z-index:160;background:rgba(15,12,41,0.92);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:8px 12px;width:200px;color:#e2e8f0;font:11px/1.4 Inter,system-ui,sans-serif;backdrop-filter:blur(10px)} #vr16-outfit h4{margin:0 0 4px;color:#06b6d4;font-size:12px}');
      fetch('https://api.open-meteo.com/v1/forecast?latitude=43.65&longitude=-79.38&current=temperature_2m&timezone=auto')
        .then(function(r){return r.json()}).then(function(d){
          if(!d||!d.current)return;
          var t=d.current.temperature_2m;var s=suggest(t);
          var el=document.createElement('div');el.id='vr16-outfit';
          el.innerHTML='<h4>'+s.icon+' What to Wear ('+Math.round(t)+'°C)</h4><div>'+s.outfit+'</div>';
          document.body.appendChild(el);
        }).catch(function(){});
    }
    setTimeout(createWidget,2500);
    return {suggest:suggest};
  })();

  /* ═══════════════════════════════════════════════
     8. CREATOR DISCOVERY QUIZ
     ═══════════════════════════════════════════════ */
  var creatorQuiz = (function(){
    if(zone!=='creators')return null;
    var quizData=[
      {q:'What type of content do you prefer?',opts:[{text:'Competitive gaming',tag:'gaming'},{text:'Just chatting/vlogs',tag:'irl'},{text:'Creative/art streams',tag:'creative'},{text:'Educational/news',tag:'educational'}]},
      {q:'Preferred energy level?',opts:[{text:'High energy & loud',tag:'hype'},{text:'Chill & relaxed',tag:'chill'},{text:'Analytical & focused',tag:'analytical'},{text:'Funny & chaotic',tag:'chaotic'}]},
      {q:'How large a community?',opts:[{text:'Huge (100K+ viewers)',tag:'large'},{text:'Medium (10K-100K)',tag:'medium'},{text:'Small & intimate',tag:'small'},{text:'Does not matter',tag:'any'}]}
    ];
    var answers=[];
    var matchResults={
      gaming_hype_large:'xQc',gaming_chill_medium:'Shroud',gaming_analytical_small:'itsHafu',
      irl_hype_large:'IShowSpeed',irl_chill_medium:'HasanAbi',creative_chill_small:'Bob Ross streams',
      educational_analytical_medium:'Linus Tech Tips',chaotic_hype_large:'Kai Cenat'
    };

    function startQuiz(){
      answers=[];
      showQuestion(0);
    }
    function showQuestion(idx){
      if(idx>=quizData.length){showResult();return;}
      var existing=document.getElementById('vr16-quiz');if(existing)existing.remove();
      css('vr16-quiz-css','#vr16-quiz{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:700;background:rgba(15,12,41,0.97);border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:24px;width:min(340px,90vw);color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)} .vr16-quiz-opt{display:block;width:100%;padding:8px;margin:4px 0;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);border-radius:8px;color:#c4b5fd;cursor:pointer;font:600 12px Inter,sans-serif;text-align:left;transition:all .15s} .vr16-quiz-opt:hover{background:rgba(168,85,247,0.12)}');
      var el=document.createElement('div');el.id='vr16-quiz';el.setAttribute('role','dialog');
      var q=quizData[idx];
      var html='<h3 style="margin:0 0 10px;color:#a855f7;font-size:15px">🔍 Creator Match ('+(idx+1)+'/'+quizData.length+')</h3><p>'+q.q+'</p>';
      q.opts.forEach(function(o){html+='<button class="vr16-quiz-opt" onclick="VRSocialRich.creatorQuiz.answerQ('+idx+',\''+o.tag+'\')">'+o.text+'</button>';});
      el.innerHTML=html;document.body.appendChild(el);
    }
    function answerQ(idx,tag){answers.push(tag);showQuestion(idx+1);}
    function showResult(){
      var key=answers.join('_');
      var match=matchResults[key]||'pokimane';
      var el=document.getElementById('vr16-quiz');if(el)el.remove();
      toast('Your creator match: '+match+' ⭐','#a855f7');
      store('quiz_result',{match:match,answers:answers,time:Date.now()});
    }
    return {start:startQuiz,answerQ:answerQ,getResult:function(){return load('quiz_result',null);}};
  })();

  /* ═══════════════════════════════════════════════
     9. HUB WORLD MAP
     ═══════════════════════════════════════════════ */
  var worldMap = (function(){
    if(zone!=='hub')return null;
    var cities=[
      {name:'Toronto',lat:43.65,lon:-79.38,events:12},
      {name:'New York',lat:40.71,lon:-74.01,events:8},
      {name:'London',lat:51.51,lon:-0.13,events:6},
      {name:'Tokyo',lat:35.68,lon:139.69,events:5},
      {name:'Sydney',lat:-33.87,lon:151.21,events:3},
      {name:'Paris',lat:48.86,lon:2.35,events:4}
    ];
    function createMap(){
      css('vr16-map-css','#vr16-world-map{position:fixed;bottom:80px;left:10px;z-index:155;background:rgba(10,10,26,0.9);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:8px;backdrop-filter:blur(8px)} #vr16-map-label{color:#64748b;font:600 9px Inter,sans-serif;text-align:center;margin-top:3px}');
      var el=document.createElement('div');el.id='vr16-world-map';
      el.innerHTML='<canvas id="vr16-map-canvas" width="180" height="100"></canvas><div id="vr16-map-label">Event Locations</div>';
      document.body.appendChild(el);drawMap();
    }
    function drawMap(){
      var c=document.getElementById('vr16-map-canvas');if(!c)return;
      var ctx=c.getContext('2d');
      ctx.fillStyle='rgba(15,12,41,0.8)';ctx.fillRect(0,0,180,100);
      // Simple equirectangular projection
      ctx.strokeStyle='rgba(0,212,255,0.08)';ctx.lineWidth=0.5;
      for(var i=0;i<7;i++){ctx.beginPath();ctx.moveTo(0,i*16.6);ctx.lineTo(180,i*16.6);ctx.stroke();}
      for(var j=0;j<10;j++){ctx.beginPath();ctx.moveTo(j*20,0);ctx.lineTo(j*20,100);ctx.stroke();}
      // Continents (very simplified blobs)
      ctx.fillStyle='rgba(0,212,255,0.06)';
      ctx.fillRect(60,15,50,30);ctx.fillRect(70,45,30,25);ctx.fillRect(120,20,40,30);ctx.fillRect(155,35,20,20);ctx.fillRect(20,20,35,25);
      // Cities
      cities.forEach(function(city){
        var x=((city.lon+180)/360)*180;
        var y=((90-city.lat)/180)*100;
        var r=2+city.events*0.3;
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle='rgba(255,107,107,0.6)';ctx.fill();
        ctx.strokeStyle='#ff6b6b';ctx.lineWidth=0.5;ctx.stroke();
        ctx.fillStyle='#94a3b8';ctx.font='7px Inter,sans-serif';ctx.textAlign='center';
        ctx.fillText(city.name,x,y+r+7);
      });
    }
    setTimeout(createMap,2500);
    return {getCities:function(){return cities;}};
  })();

  /* ═══════════════════════════════════════════════
     10. PROGRESS MILESTONES
     ═══════════════════════════════════════════════ */
  var milestones = (function(){
    var thresholds=[{n:10,badge:'🌱',title:'Seedling'},{n:25,badge:'🌿',title:'Sprout'},{n:50,badge:'🌳',title:'Tree'},{n:75,badge:'🏔️',title:'Mountain'},{n:100,badge:'🌟',title:'Star'},{n:150,badge:'💎',title:'Diamond'}];
    var unlocked=load('milestones',[]);

    function countFeatures(){
      var count=0;
      ['VRPersonalization','VRAdvancedUX','VRComfortIntel','VRContentDepth','VRPolish','VRSocialRich','VRCompleteness','VRInteraction','VRSceneEnhancements'].forEach(function(g){
        if(window[g])count+=10;
      });
      try{var ach=JSON.parse(localStorage.getItem('vr10_achievements')||'[]');count+=ach.length;}catch(e){}
      try{var sess=JSON.parse(localStorage.getItem('vr12_sessions')||'[]');count+=Math.min(sess.length,20);}catch(e){}
      return count;
    }

    function check(){
      var c=countFeatures();
      thresholds.forEach(function(t){
        if(c>=t.n&&unlocked.indexOf(t.n)===-1){
          unlocked.push(t.n);store('milestones',unlocked);
          toast(t.badge+' Milestone: '+t.title+' ('+t.n+' features)','#f59e0b');
        }
      });
    }

    function getUnlocked(){return unlocked.map(function(n){return thresholds.find(function(t){return t.n===n;});}).filter(Boolean);}

    setTimeout(check,4000);
    return {check:check,getUnlocked:getUnlocked,count:countFeatures,thresholds:thresholds};
  })();

  /* ═══════════════════════════════════════════════ */
  window.VRSocialRich={
    zone:zone,version:16,
    profile:profile,leaderboard:leaderboard,eventReminders:eventReminders,
    movieTrivia:movieTrivia,stockNews:stockNews,wellnessJournal:wellnessJournal,
    weatherOutfit:weatherOutfit,creatorQuiz:creatorQuiz,worldMap:worldMap,milestones:milestones
  };
  console.log('[VR Social & Rich] Set 16 loaded — '+zone+' ('+profile.get().avatar+' '+profile.get().name+')');
})();
