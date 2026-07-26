import { NetworkManager } from './network.js';
import { UIManager } from './ui.js';
import { GameEngine } from './game.js';

/**
 * 系統初始化與事件綁定
 * 確保 HTML DOM 完全載入後才執行程式
 */
document.addEventListener('DOMContentLoaded', () => {
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinRoom = document.getElementById('btn-join-room');
    const inputRoomId = document.getElementById('input-room-id');
    const roomIdDisplay = document.getElementById('room-id-display');
    const connectionStatus = document.getElementById('connection-status');
    const lobbyContainer = document.getElementById('lobby-container');
    const gameContainer = document.getElementById('game-container');
    const deckCountDisplay = document.getElementById('deck-count'); // 取得牌庫數字節點
    
    let isHost = false; 

    const gameEngine = new GameEngine();

    const uiManager = new UIManager(
        {
            board: document.getElementById('board'),
            hand: document.getElementById('hand-container'),
            apDisplay: document.getElementById('ap-display')
        },
        {
            onCardDropped: (data) => {
                const result = gameEngine.playCard(data.cardId, data.targetX, data.targetY);
                
                if (result.success) {
                    uiManager.renderHand(result.updatedHand);
                    uiManager.updateAP(result.currentAP, gameEngine.maxAP);
                    
                    networkManager.sendData({
                        action: 'PLAY_CARD',
                        cardId: data.cardId,
                        targetX: data.targetX,
                        targetY: data.targetY
                    });
                } else {
                    console.warn('出牌失敗:', result.reason);
                }
            },
            onCellClicked: (data) => {
                console.log('使用者點擊棋盤網格:', data);
            }
        }
    );

    const networkManager = new NetworkManager({
        onReady: (id) => {
            roomIdDisplay.textContent = id;
            connectionStatus.textContent = '系統狀態：等待對手加入...';
        },
        onConnected: () => {
            connectionStatus.textContent = '系統狀態：連線成功！遊戲即將開始...';
            
            lobbyContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            
            // ----------------------------------------------------
            // 模擬外部構築好的 20 張牌組 (15 士兵, 5 技能)
            const myDeck = [];
            for (let i = 1; i <= 15; i++) {
                // 每張卡需給予初始 CD 值
                myDeck.push({ id: `soldier_${i}`, name: '步兵', type: 'SOLDIER', currentCD: 1 });
            }
            for (let i = 1; i <= 5; i++) {
                myDeck.push({ id: `skill_${i}`, name: '戰術衝鋒', type: 'SKILL', currentCD: 2 });
            }
            // ----------------------------------------------------

            // 啟動遊戲核心邏輯，傳入建構好的牌組
            gameEngine.initGame(isHost, myDeck);
            const initialState = gameEngine.getState();
            
            // 依據底層資料渲染初始畫面
            uiManager.renderBoard();
            uiManager.renderHand(initialState.hand);
            uiManager.updateAP(initialState.ap, initialState.maxAP);
            
            // 更新畫面上顯示的牌庫剩餘數量
            if (deckCountDisplay) {
                deckCountDisplay.textContent = initialState.deckCount;
            }
        },
        onDataReceived: (data) => {
            console.log('接收到同步指令:', data);
            if (data.action === 'PLAY_CARD') {
                console.log(`對手將卡牌放置於 [${data.targetX}, ${data.targetY}]`);
            }
        },
        onError: (err) => {
            connectionStatus.textContent = `系統狀態：發生錯誤 (${err.message})`;
            console.error('連線模組錯誤:', err);
            
            btnCreateRoom.disabled = false;
            btnJoinRoom.disabled = false;
        }
    });

    btnCreateRoom.addEventListener('click', () => {
        isHost = true;
        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        connectionStatus.textContent = '系統狀態：正在建立房間...';
        networkManager.initializeHost();
    });

    btnJoinRoom.addEventListener('click', () => {
        isHost = false;
        const hostId = inputRoomId.value.trim();
        
        if (!hostId) {
            alert('請輸入有效的房間代碼');
            return;
        }

        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        connectionStatus.textContent = '系統狀態：正在連線至房間...';
        networkManager.connectToHost(hostId);
    });
});
