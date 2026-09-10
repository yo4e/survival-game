/* eslint-disable react-hooks/purity */
import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Snowflake, Skull, Fish, Radio, Tent,
  Wind, Ticket, Syringe, TreePine, Waves, Ban,
  Heart, Zap, Brain, Moon, Sun, AlertTriangle,
  Backpack, Utensils, Droplet, PlusCircle
} from 'lucide-react';

// --- Game Data ---
const ITEMS = {
  water: { name: '汚れた水', icon: <Droplet size={14} />, desc: '喉を潤すが必要最低限だ。(HP+5)', effect: { hp: 5, hunger: -5 } },
  clean_water: { name: '雪解け水', icon: <Droplet size={14} className="text-blue-400" />, desc: '冷たくて美味しい水。(Sanity+5, Hunger-5)', effect: { sanity: 5, hunger: -5 } },
  ration: { name: '非常食', icon: <Utensils size={14} className="text-orange-400" />, desc: '高カロリーな保存食。(Hunger-30)', effect: { hunger: -30 } },
  fish: { name: '魚', icon: <Fish size={14} className="text-blue-300" />, desc: '生の魚。少し臭う。(Hunger-20)', effect: { hunger: -20 } },
  potato: { name: 'ふかした芋', icon: <Utensils size={14} className="text-yellow-600" />, desc: '温かい芋。心が安らぐ。(Hunger-15, Sanity+5)', effect: { hunger: -15, sanity: 5 } },
  medkit: { name: '救急セット', icon: <PlusCircle size={14} className="text-red-500" />, desc: '傷の手当てができる。(HP+50)', effect: { hp: 50 } },
  wood: { name: '薪', icon: <TreePine size={14} className="text-amber-700" />, desc: '火を起こすのに使える。', effect: null }, // Crafting material (future use)
};

const STAGES = [
  {
    id: 'mountain',
    name: '極寒の雪山',
    desc: '猛吹雪と飢えが襲う。火を絶やすな。',
    goal: 10,
    color: 'text-blue-300',
    bg: 'bg-slate-900',
    actions: [
      { id: 'fire', name: '焚き火', cost: 15, icon: <Flame size={16} />, desc: '体温を回復' },
      { id: 'snow', name: '雪を掘る', cost: 20, icon: <Snowflake size={16} />, desc: '水と食料を探す' },
      { id: 'rest', name: '雪洞で寝る', cost: 0, icon: <Tent size={16} />, desc: 'スタミナ回復・翌日へ' },
    ]
  },
  {
    id: 'island',
    name: '絶海の無人島',
    desc: '日差しと渇き。脱出の機会を待て。',
    goal: 10,
    color: 'text-yellow-300',
    bg: 'bg-sky-900',
    actions: [
      { id: 'fish', name: '釣り', cost: 25, icon: <Fish size={16} />, desc: '食料確保' },
      { id: 'search', name: '探索', cost: 20, icon: <TreePine size={16} />, desc: '何か落ちているかも' },
      { id: 'signal', name: '狼煙(のろし)', cost: 30, icon: <Wind size={16} />, desc: '救助率アップ' },
      { id: 'rest', name: '木陰で寝る', cost: 0, icon: <Tent size={16} />, desc: 'スタミナ回復・翌日へ' },
    ]
  },
  {
    id: 'shelter',
    name: '核シェルター',
    desc: '孤独と放射能。正気を保てるか。',
    goal: 15,
    color: 'text-green-400',
    bg: 'bg-zinc-900',
    actions: [
      { id: 'check', name: '点検', cost: 10, icon: <AlertTriangle size={16} />, desc: '設備異常を防ぐ' },
      { id: 'scavenge', name: '倉庫あさり', cost: 20, icon: <Backpack size={16} />, desc: '物資を探す' },
      { id: 'radio', name: '無線傍受', cost: 15, icon: <Radio size={16} />, desc: '情報を集める' },
      { id: 'rest', name: '仮眠', cost: 0, icon: <Tent size={16} />, desc: 'スタミナ回復・翌日へ' },
    ]
  },
  {
    id: 'wartime',
    name: '戦時下の街',
    desc: '警報と密告。誰も信じるな。',
    goal: 20,
    color: 'text-red-500',
    bg: 'bg-stone-900',
    isHidden: true,
    actions: [
      { id: 'market', name: '闇市', cost: 20, icon: <Ticket size={16} />, desc: '物資を交換' },
      { id: 'rubble', name: '瓦礫あさり', cost: 25, icon: <Ban size={16} />, desc: '使えるものを探す' },
      { id: 'hiding', name: '防空壕', cost: 10, icon: <Ban size={16} />, desc: '空襲をやり過ごす' },
      { id: 'rest', name: '隠れて寝る', cost: 0, icon: <Tent size={16} />, desc: 'スタミナ回復・翌日へ' },
    ]
  }
];

const SAVE_KEY = 'survival-game-save-v2';

const loadState = (key, defaultVal) => {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return defaultVal;
  try {
    const parsed = JSON.parse(saved);
    return parsed[key] !== undefined ? parsed[key] : defaultVal;
  } catch (e) {
    console.error('Save load error', e);
    return defaultVal;
  }
};

const clampStat = (value) => Math.max(0, Math.min(100, value));

const applyStatDelta = (baseStats, key, delta) => ({
  ...baseStats,
  [key]: clampStat(baseStats[key] + delta),
});

export default function App() {
  // --- State ---
  const [stageIdx, setStageIdx] = useState(() => loadState('stageIdx', 0));
  const [day, setDay] = useState(() => loadState('day', 1));
  const [stats, setStats] = useState(() => loadState('stats', {
    hp: 100,
    stamina: 100,
    sanity: 100,
    hunger: 0,
  }));
  const [inventory, setInventory] = useState(() => loadState('inventory', {}));

  // Logs state with migration support
  const [logs, setLogs] = useState(() => {
    const loaded = loadState('logs', [{ text: 'ゲーム開始...生き残れ。', type: 'normal' }]);
    if (Array.isArray(loaded) && loaded.length > 0 && typeof loaded[0] === 'string') {
      return loaded.map(txt => ({ text: txt, type: 'normal' }));
    }
    return loaded;
  });

  const [gameOver, setGameOver] = useState(() => loadState('gameOver', false));
  const [gameClear, setGameClear] = useState(() => loadState('gameClear', false));
  const [isDamaged, setIsDamaged] = useState(false);
  const logsEndRef = useRef(null);

  const currentStage = STAGES[stageIdx];

  // Auto-Save
  useEffect(() => {
    const dataToSave = { stageIdx, day, stats, inventory, logs, gameOver, gameClear };
    localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
  }, [stageIdx, day, stats, inventory, logs, gameOver, gameClear]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Logic ---
  const addLog = (text, type = 'normal') => {
    setLogs(prev => [...prev, { text, type, id: Date.now() }]);
  };

  const triggerDamageEffect = () => {
    setIsDamaged(true);
    setTimeout(() => setIsDamaged(false), 500);
  };

  const updateStat = (key, delta) => {
    setStats(prev => applyStatDelta(prev, key, delta));

    if (key === 'hp' && delta < 0) {
      triggerDamageEffect();
    }
  };

  const addItem = (itemId, count = 1) => {
    setInventory(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + count
    }));
    addLog(`${ITEMS[itemId].name} x${count} を手に入れた！`, 'success');
  };

  const consumeItem = (itemId) => {
    if (!inventory[itemId] || inventory[itemId] <= 0) return;
    const item = ITEMS[itemId];

    if (!item.effect) {
      addLog(`${item.name}はそのままでは使えない。`, 'warn');
      return;
    }

    setInventory(prev => ({
      ...prev,
      [itemId]: prev[itemId] - 1
    }));

    if (item.effect.hp) updateStat('hp', item.effect.hp);
    if (item.effect.sanity) updateStat('sanity', item.effect.sanity);
    if (item.effect.hunger) updateStat('hunger', item.effect.hunger);

    addLog(`${item.name}を使った。`, 'success');
  };

  const handleAction = (actionId, cost) => {
    if (gameOver || gameClear) return;

    if (stats.stamina < cost) {
      addLog('スタミナが足りない！休む必要がある。', 'warn');
      return;
    }

    let nextStats = applyStatDelta(stats, 'stamina', -cost);
    nextStats = applyStatDelta(nextStats, 'hunger', 5);

    const applyActionStat = (key, delta) => {
      nextStats = applyStatDelta(nextStats, key, delta);
      if (key === 'hp' && delta < 0) {
        triggerDamageEffect();
      }
    };

    // Action Effects
    const roll = Math.random();
    const isSuccess = roll > 0.3;
    const isCrit = roll > 0.9;

    switch (actionId) {
      case 'rest': {
        const nextDay = day + 1;
        nextStats = {
          ...nextStats,
          stamina: 100,
          hp: clampStat(nextStats.hp + 5),
          sanity: clampStat(nextStats.sanity + 10),
        };

        addLog(`--- ${nextDay}日目 ---`);
        nextStats = processNightEvent(nextStats);
        setStats(nextStats);
        setDay(nextDay);

        if (nextStats.hp <= 0) {
          setGameOver(true);
          addLog('もう動けない... [GAMEOVER]', 'danger');
        } else {
          checkSurvival(nextDay);
        }
        return; // End turn
      }

      case 'fire':
        if (isSuccess) {
          applyActionStat('hp', 10);
          applyActionStat('sanity', 5);
          addLog('火が燃えている。暖かい...');
        } else {
          addLog('火がなかなかつかない...');
        }
        break;

      case 'snow':
        if (isSuccess) {
          if (isCrit) {
             addItem('ration', 1);
          } else {
             addItem('clean_water', 1);
          }
        } else {
          applyActionStat('hp', -5);
          addLog('何も見つからない。指先が凍傷になりそうだ。');
        }
        break;

      case 'fish':
        if (isSuccess) {
          addItem('fish', isCrit ? 2 : 1);
        } else {
          addLog('一匹も釣れなかった...');
        }
        break;

      case 'search': // Island search
        if (isSuccess) {
           if (isCrit) addItem('medkit', 1);
           else addItem('water', 1);
        } else {
           addLog('何も見つからない。');
        }
        break;

      case 'signal':
        addLog('空に向かって煙を上げた。誰か気づいてくれ...');
        break;

      case 'check': // Shelter check
        applyActionStat('sanity', 5);
        addLog('設備は正常だ。少し安心した。');
        break;

      case 'scavenge': // Shelter scavenge
        if (isSuccess) {
           if (isCrit) addItem('medkit', 1);
           else addItem('ration', 1);
        } else {
           addLog('めぼしいものは残っていない...');
        }
        break;

      case 'market': {
        const trade = Math.random() > 0.4;
        if (trade) {
          addItem('potato', 1);
        } else {
          applyActionStat('sanity', -10);
          addLog('憲兵に見つかりそうになった！逃げた。');
        }
        break;
      }

      case 'rubble': // Wartime rubble
        if (isSuccess) {
            addItem('water', 1);
        } else {
            applyActionStat('hp', -5);
            addLog('崩れた壁に足をぶつけた。痛い。');
        }
        break;

      case 'hiding':
         applyActionStat('sanity', 5);
         addLog('じっと息を潜めた...');
         break;

      case 'radio':
        addLog('ノイズの中に人の声が聞こえた気がする...');
        applyActionStat('sanity', 2);
        break;

      default:
        addLog('行動した。');
    }

    if (nextStats.hunger >= 100) {
      applyActionStat('hp', -10);
      addLog('空腹で倒れそうだ...(HP減少)', 'danger');
    }

    setStats(nextStats);

    if (nextStats.hp <= 0) {
      setGameOver(true);
      addLog('目の前が真っ暗になった... [GAMEOVER]', 'danger');
    }
  };

  const processNightEvent = (baseStats) => {
    const roll = Math.random();
    let nextStats = { ...baseStats };

    const applyNightStat = (key, delta) => {
      nextStats = applyStatDelta(nextStats, key, delta);
      if (key === 'hp' && delta < 0) {
        triggerDamageEffect();
      }
    };

    // Stage Specific Events
    let eventLog = '';
    let type = 'normal';

    // 20% Bad Event, 10% Good Event, 70% Flavor
    if (roll < 0.2) {
      // BAD EVENT
      const dmg = Math.floor(Math.random() * 10) + 10; // 10-20 dmg
      applyNightStat('hp', -dmg);
      type = 'danger';

      switch (currentStage.id) {
        case 'mountain':
          eventLog = `猛吹雪がテントを襲う！寒さで体力を奪われた。(HP-${dmg})`;
          break;
        case 'island':
          eventLog = `夜中に毒虫に刺された！痛みが走る。(HP-${dmg})`;
          break;
        case 'shelter':
          eventLog = `配管から汚染水が漏れている！被曝した可能性がある。(HP-${dmg})`;
          applyNightStat('sanity', -10);
          break;
        case 'wartime':
          eventLog = `近くに砲弾が着弾した！衝撃で吹き飛ばされた。(HP-${dmg})`;
          applyNightStat('sanity', -20);
          break;
        default:
          eventLog = `夜中にアクシデント発生！HP-${dmg}`;
      }
    } else if (roll > 0.9) {
      // GOOD EVENT
      applyNightStat('sanity', 20);
      type = 'success';

      switch (currentStage.id) {
        case 'mountain':
          eventLog = 'オーロラが見えた。息をのむ美しさだ。(Sanity+20)';
          break;
        case 'island':
          eventLog = '満天の星空。波の音が心地よい。(Sanity+20)';
          break;
        case 'shelter':
          eventLog = '古いレコードを見つけた。懐かしい音楽に癒される。(Sanity+20)';
          break;
        case 'wartime':
          eventLog = '静かな夜だ。遠くで誰かが歌っているのが聞こえる。(Sanity+20)';
          break;
        default:
          eventLog = '今夜はよく眠れそうだ。(Sanity+20)';
      }
    } else {
       // FLAVOR TEXT
       const flavors = {
         mountain: [
           '風の音が唸りを上げている...',
           'テントの外は白銀の世界だ。',
           '寒さで手足の感覚がない。',
         ],
         island: [
           '遠くで獣の鳴き声がする。',
           '湿気がひどい。寝苦しい夜だ。',
           '焚き火の煙が目に染みる。',
         ],
         shelter: [
           '換気扇の回る音だけが響く。',
           '壁のシミが人の顔に見える...',
           '水滴の落ちる音が気になって眠れない。',
         ],
         wartime: [
           'サイレンの音が遠くで鳴っている。',
           '誰かの足音が近づいてくる...気のせいか。',
           '壁の向こうで怒鳴り声が聞こえる。',
         ]
       };
       const list = flavors[currentStage.id] || ['夜が更けていく...'];
       eventLog = list[Math.floor(Math.random() * list.length)];
    }

    addLog(eventLog, type);
    return nextStats;
  };

  const checkSurvival = (currentDay) => {
    const target = currentStage.goal;
    if (currentDay >= target) {
      if (stageIdx < STAGES.length - 1) {
        setStageIdx(prev => prev + 1);
        setDay(1);
        setStats(prev => ({ ...prev, stamina: 100 }));
        addLog(`ステージクリア！次の場所へ移動した...`, 'success');
      } else {
        setGameClear(true);
        addLog('生き残った！救援隊が到着した！ [GAME CLEAR]', 'success');
      }
    }
  };

  const restart = () => {
    localStorage.removeItem(SAVE_KEY);
    setStageIdx(0);
    setDay(1);
    setStats({ hp: 100, stamina: 100, sanity: 100, hunger: 0 });
    setInventory({});
    setGameOver(false);
    setGameClear(false);
    setLogs([{ text: '再挑戦...生き残れ。', type: 'normal' }]);
  };

  // --- Rendering ---
  return (
    <div className={`relative min-h-screen ${currentStage.bg || 'bg-[#111]'} text-[#eee] flex flex-col items-center max-w-md mx-auto shadow-2xl overflow-hidden font-sans transition-colors duration-1000 ${isDamaged ? 'shake' : ''}`}>
      <div className="scanlines pointer-events-none fixed inset-0 z-50 opacity-10"></div>
      {isDamaged && <div className="damage-flash"></div>}

      {/* Weather Effects */}
      {currentStage.id === 'mountain' && <div className="weather-snow"></div>}
      {currentStage.id === 'wartime' && <div className="weather-dust"></div>}
      {currentStage.id === 'shelter' && <div className="absolute inset-0 bg-green-900/10 pointer-events-none z-0"></div>}

      {/* Header Info */}
      <header className="w-full p-4 bg-[#222] border-b-2 border-[#444] z-10 flex justify-between items-center">
        <div>
          <h1 className={`text-sm font-bold ${currentStage.color}`}>{currentStage.name}</h1>
          <div className="text-xs text-gray-400">Day {day} / {currentStage.goal}</div>
        </div>
        <div className="text-right text-xs">
          <div className="flex items-center justify-end gap-1 text-red-400 font-mono"><Heart size={12} /> {Math.floor(stats.hp)}</div>
          <div className="flex items-center justify-end gap-1 text-yellow-400 font-mono"><Zap size={12} /> {Math.floor(stats.stamina)}</div>
        </div>
      </header>

      {/* Main Stats Panel */}
      <section className="w-full p-3 bg-[#1a1a1a] grid grid-cols-2 gap-4 text-xs z-10 border-b border-[#333]">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-purple-400"><span>Sanity</span> <span>{Math.floor(stats.sanity)}%</span></div>
          <div className="w-full bg-gray-800 h-2 rounded overflow-hidden">
            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${stats.sanity}%` }}></div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-orange-400"><span>Hunger</span> <span>{Math.floor(stats.hunger)}%</span></div>
          <div className="w-full bg-gray-800 h-2 rounded overflow-hidden">
            <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${stats.hunger}%` }}></div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="col-span-2 mt-2 pt-2 border-t border-[#333]">
           <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
             <Backpack size={10} /> Inventory
           </h3>
           <div className="flex flex-wrap gap-2">
             {Object.keys(inventory).length === 0 && <span className="text-gray-600 text-xs italic">空っぽだ...</span>}
             {Object.entries(inventory).map(([id, count]) => (
               count > 0 && (
                 <button
                   key={id}
                   onClick={() => consumeItem(id)}
                   className="flex items-center gap-1 bg-[#333] border border-[#555] px-2 py-1 rounded text-xs hover:bg-[#444] active:scale-95 transition-transform"
                   title={ITEMS[id].desc}
                 >
                   {ITEMS[id].icon}
                   <span>{ITEMS[id].name}</span>
                   <span className="bg-black/50 px-1 rounded text-[10px] text-gray-300">x{count}</span>
                 </button>
               )
             ))}
           </div>
        </div>
      </section>

      {/* Log Window */}
      <main className="flex-1 w-full bg-[#000] p-4 overflow-y-auto space-y-2 z-10 scrollbar-hide">
        {logs.map((log, i) => (
          <div key={i} className={`text-sm leading-relaxed border-l-2 pl-2 animate-fade-in ${
            log.type === 'danger' || (typeof log === 'string' && log.includes('GAMEOVER')) ? 'border-red-600 text-red-500 font-bold' :
            log.type === 'success' || (typeof log === 'string' && log.includes('success')) ? 'border-green-500 text-green-400' :
            log.type === 'warn' ? 'border-yellow-500 text-yellow-300' :
            'border-gray-700 text-gray-300'
            }`}>
            {log.text || log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </main>

      {/* Action Grid */}
      <footer className="w-full p-2 bg-[#222] z-10 border-t border-[#444]">
        {gameOver || gameClear ? (
          <button onClick={restart} className="w-full py-4 bg-white text-black font-bold text-lg animate-bounce">
            {gameClear ? 'THE END (TAP TO RESTART)' : 'GAME OVER (RETRY)'}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {currentStage.actions.map(act => (
              <button
                key={act.id}
                onClick={() => handleAction(act.id, act.cost)}
                disabled={stats.stamina < act.cost}
                className="relative flex flex-col items-center justify-center p-3 text-sm bg-[#333] border border-[#555] hover:bg-[#3a3a3a] active:bg-[#555] disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors group"
              >
                <div className="mb-1 text-gray-300 group-hover:scale-110 transition-transform">{act.icon}</div>
                <span className="font-bold text-gray-200">{act.name}</span>
                <span className="text-[10px] text-yellow-500 font-mono mt-1">-{act.cost} SP</span>
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
