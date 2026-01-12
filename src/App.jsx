import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Snowflake, Skull, Fish, Radio, Tent,
  Wind, Ticket, Syringe, TreePine, Waves, Ban,
  Heart, Zap, Brain, Moon, Sun, AlertTriangle
} from 'lucide-react';

// --- Game Data ---
const STAGES = [
  {
    id: 'mountain',
    name: '極寒の雪山',
    desc: '猛吹雪と飢えが襲う。火を絶やすな。',
    goal: 10, // Days to clear (shortened for demo)
    color: 'text-blue-300',
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
    actions: [
      { id: 'fish', name: '釣り', cost: 25, icon: <Fish size={16} />, desc: '食料確保' },
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
    actions: [
      { id: 'check', name: '点検', cost: 10, icon: <AlertTriangle size={16} />, desc: '設備異常を防ぐ' },
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
    isHidden: true,
    actions: [
      { id: 'market', name: '闇市', cost: 20, icon: <Ticket size={16} />, desc: '物資を交換' },
      { id: 'hiding', name: '防空壕', cost: 10, icon: <Ban size={16} />, desc: '空襲をやり過ごす' },
      { id: 'rest', name: '隠れて寝る', cost: 0, icon: <Tent size={16} />, desc: 'スタミナ回復・翌日へ' },
    ]
  }
];

// --- Game Data ---
const SAVE_KEY = 'survival-game-save-v1';

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

export default function App() {
  // --- State ---
  const [stageIdx, setStageIdx] = useState(() => loadState('stageIdx', 0));
  const [day, setDay] = useState(() => loadState('day', 1));
  const [stats, setStats] = useState(() => loadState('stats', {
    hp: 100,      // Max 100
    stamina: 100, // Max 100
    sanity: 100,  // Max 100
    hunger: 0,    // Max 100 (0 is best)
  }));
  const [logs, setLogs] = useState(() => loadState('logs', ['ゲーム開始...生き残れ。']));
  const [gameOver, setGameOver] = useState(() => loadState('gameOver', false));
  const [gameClear, setGameClear] = useState(() => loadState('gameClear', false));
  const logsEndRef = useRef(null);

  const currentStage = STAGES[stageIdx];

  // Auto-Save
  useEffect(() => {
    const dataToSave = { stageIdx, day, stats, logs, gameOver, gameClear };
    localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
  }, [stageIdx, day, stats, logs, gameOver, gameClear]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Logic ---
  const addLog = (text, type = 'normal') => {
    setLogs(prev => [...prev, text]);
  };

  const updateStat = (key, delta) => {
    setStats(prev => {
      const newVal = Math.max(0, Math.min(100, prev[key] + delta));
      return { ...prev, [key]: newVal };
    });
  };

  const handleAction = (actionId, cost) => {
    if (gameOver || gameClear) return;

    if (stats.stamina < cost) {
      addLog('スタミナが足りない！休む必要がある。', 'warn');
      return;
    }

    // Pay Cost
    updateStat('stamina', -cost);
    updateStat('hunger', 5); // Acting makes you hungry

    // Action Effects
    const roll = Math.random();
    const isSuccess = roll > 0.3; // 70% success rate
    const isCrit = roll > 0.9;

    switch (actionId) {
      case 'rest':
        const heal = 50;
        const sanityHeal = 10;
        setStats(prev => ({
          ...prev,
          stamina: 100, // Full recover
          hp: Math.min(100, prev.hp + 5),
          sanity: Math.min(100, prev.sanity + sanityHeal)
        }));
        setDay(d => d + 1);
        addLog(`--- ${day + 1}日目 ---`);
        processNightEvent();
        checkSurvival();
        return; // End turn

      case 'fire':
        if (isSuccess) {
          updateStat('hp', 10);
          updateStat('sanity', 5);
          addLog('火が燃えている。暖かい...');
        } else {
          addLog('火がなかなかつかない...');
        }
        break;

      case 'snow':
        if (isSuccess) {
          updateStat('hunger', -15);
          addLog(isCrit ? '非常食を見つけた！(満腹度回復)' : '雪を溶かして水を飲んだ。');
        } else {
          updateStat('hp', -5); // Freeze
          addLog('何も見つからない。指先が凍傷になりそうだ。');
        }
        break;

      case 'fish':
        if (isSuccess) {
          updateStat('hunger', -25);
          addLog(isCrit ? '大物が釣れた！' : '小魚を釣った。');
        } else {
          addLog('一匹も釣れなかった...');
        }
        break;

      case 'signal':
        addLog('空に向かって煙を上げた。誰か気づいてくれ...');
        break;

      case 'market':
        const trade = Math.random() > 0.5;
        if (trade) {
          updateStat('hunger', -20);
          addLog('闇市でイモを手に入れた。');
        } else {
          updateStat('sanity', -10);
          addLog('憲兵に見つかりそうになった！逃げた。');
        }
        break;

      default:
        addLog('行動した。');
    }

    // Check Stats after action
    if (stats.hunger >= 100) {
      updateStat('hp', -10);
      addLog('空腹で倒れそうだ...(HP減少)', 'danger');
    }
    if (stats.hp <= 0) {
      setGameOver(true);
      addLog('目の前が真っ暗になった... [GAMEOVER]', 'danger');
    }
  };

  const processNightEvent = () => {
    // Random Night Event
    const eventRoll = Math.random();
    if (eventRoll < 0.2) {
      // Bad Event
      const dmg = 15;
      updateStat('hp', -dmg);
      addLog(`夜中にアクシデント発生！HP-${dmg}`, 'danger');
    } else if (eventRoll > 0.9) {
      // Good Event
      updateStat('sanity', 20);
      addLog('きれいな星が見えた。心が安らぐ。', 'success');
    }

    // Survival Check
    if (stats.hp <= 0) {
      setGameOver(true);
      addLog('もう動けない... [GAMEOVER]', 'danger');
    }
  };

  const checkSurvival = () => {
    const target = currentStage.goal;
    if (day >= target) {
      if (stageIdx < STAGES.length - 1) {
        setStageIdx(prev => prev + 1);
        setDay(1);
        setStats(prev => ({ ...prev, stamina: 100 })); // Reset stamina but keep HP/Sanity? Or heal?
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
    setGameOver(false);
    setGameClear(false);
    setLogs(['再挑戦...生き残れ。']);
  };

  // --- Rendering ---
  return (
    <div className="relative min-h-screen bg-[#111] text-[#eee] flex flex-col items-center max-w-md mx-auto shadow-2xl overflow-hidden font-pixel">
      <div className="scanlines"></div>

      {/* Header Info */}
      <header className="w-full p-4 bg-[#222] border-b-2 border-[#444] z-10 flex justify-between items-center">
        <div>
          <h1 className={`text-sm ${currentStage.color}`}>{currentStage.name}</h1>
          <div className="text-xs text-gray-400">Day {day} / {currentStage.goal}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-red-400"><Heart size={12} /> {Math.floor(stats.hp)}</div>
          <div className="flex items-center gap-1 text-yellow-400"><Zap size={12} /> {Math.floor(stats.stamina)}</div>
        </div>
      </header>

      {/* Main Stats Panel */}
      <section className="w-full p-2 bg-[#1a1a1a] grid grid-cols-2 gap-2 text-xs z-10">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-purple-400" />
          <div className="w-full bg-gray-700 h-2 rounded overflow-hidden">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${stats.sanity}%` }}></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Syringe size={14} className="text-orange-400" /> {/* Hunger icon replacement */}
          <div className="w-full bg-gray-700 h-2 rounded overflow-hidden">
            <div className="bg-orange-500 h-full transition-all" style={{ width: `${stats.hunger}%` }}></div>
          </div>
        </div>
        <div className="col-span-2 text-center text-gray-500 mt-1">
          {stats.hunger > 80 && <span className="text-red-500 animate-pulse">空腹！</span>}
          {stats.hp < 30 && <span className="text-red-500 animate-pulse ml-2">危険！</span>}
        </div>
      </section>

      {/* Log Window */}
      <main className="flex-1 w-full bg-[#000] p-4 overflow-y-auto space-y-2 z-10 border-b-2 border-[#444]">
        {logs.map((log, i) => (
          <div key={i} className={`text-sm leading-relaxed border-l-2 pl-2 ${log.includes('GAMEOVER') ? 'border-red-600 text-red-500 font-bold' :
            log.includes('success') ? 'border-green-500 text-green-400' :
              log.includes('danger') ? 'border-red-500 text-red-400' :
                'border-gray-700 text-gray-300'
            }`}>
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </main>

      {/* Action Grid */}
      <footer className="w-full p-2 bg-[#222] z-10">
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
                className="flex flex-col items-center justify-center p-3 text-sm bg-[#333] border border-[#555] active:bg-[#555] disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                <div className="mb-1 text-gray-300">{act.icon}</div>
                <span>{act.name}</span>
                <span className="text-[10px] text-yellow-500 font-mono">-{act.cost} SP</span>
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
