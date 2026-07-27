import { NetworkManager } from './network.js';
import { UIManager } from './ui.js';
import { GameEngine } from './game.js';
import { getCardById } from './cards.js'; // 引入卡牌圖鑑與工廠函式

document.addEventListener('DOMContentLoaded', () => {
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinRoom = document.getElementById('btn-join-room');
    const inputRoomId = document.getElementById('input-room-id');
    const roomIdDisplay = document.getElementById('room-id-display');
    const connectionStatus = document.getElementById('connection-status');
    const lobbyContainer = document.getElementById('lobby-container');
    const gameContainer = document.getElementById('game-container');
    const deckCountDisplay = document.getElementById('deck-count');
    
    let isHost = false; 

    const gameEngine = new GameEngine();

    const uiManager = new UIManager(
        {
            board: document.getElementById('board'),
            hand: document.getElementById('hand-container'),
            apDisplay: document.getElementById('ap-display'),
            btnEndTurn: document.getElementById('btn-end-turn'),
            turnIndicator: document.getElementById('turn-indicator')
        },
        {
            onCardDropped: (data) => {
                const result = gameEngine.playCard(data.cardId, data.targetX, data.targetY);
                
                if (result.success) {
                    const currentState = gameEngine.getState();
                    uiManager.renderHand(currentState.hand, currentState.isMyTurn);
                    uiManager.updateAP(currentState.ap, currentState.maxAP);
                    uiManager.renderBoard(currentState.board); 
                    
                    networkManager.sendData({
                        action: 'PLAY_CARD',
                        cardId: data.cardId,
                        cardName: result.playedCard.name, 
                        cardType: result.playedCard.type,
                        targetX: data.targetX,
                        targetY: data.targetY
                    });
                } else {
                    console.warn('出牌失敗:', result.reason);
                }
            },
            onCellClicked: (data) => {
                console.log('使用者點擊棋盤網格:', data);
            },
            onEndTurnClicked: () => {
                const state = gameEngine.endTurn();
                uiManager.updateTurnStatus(state.isMyTurn);
                uiManager.renderHand(state.hand, state.isMyTurn);
                
                networkManager.sendData({
                    action: 'END_TURN'
                });
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
            
            // 透過卡牌圖鑑動態建構真實的 20 張牌組
            const myDeck = [];
            
            // 準備目前圖鑑中可用的 8 種士兵 ID
            const soldierIds = ['h_sol_1', 'h_sol_2', 'h_sol_3', 'h_sol_4', 'h_sol_5', 'h_sol_6', 'h_sol_7', 'h_sol_8'];
            
            // 放入 15 張士兵卡 (自圖鑑循環抽取以進行測試)
            for (let i = 0; i < 15; i++) {
                const templateId = soldierIds[i % soldierIds.length];
                const cardData = getCardById(templateId);
                
                if (cardData) {
                    myDeck.push({
                        ...cardData,
                        templateId: templateId, // 保留原始圖鑑 ID 以供未來查詢對照
                        id: `${templateId}_${Date.now()}_${i}`, // 產生遊戲內唯一 ID，配合現有 GameEngine
                        currentCD: cardData.baseCD // 將基礎 CD 轉化為當前 CD 供狀態機運算
                    });
                }
            }

            // 由於尚未定義真實的技能卡圖鑑，此處暫時保留 5 張模擬技能卡防呆
            for (let i = 1; i <= 5; i++) {
                myDeck.push({ 
                    id: `skill_mock_${Date.now()}_${i}`, 
                    name: '戰術衝鋒', 
                    type: 'SKILL', 
                    currentCD: 2 
                });
            }

            gameEngine.initGame(isHost, myDeck);
            const initialState = gameEngine.getState();
            
            uiManager.renderBoard(initialState.board);
            uiManager.renderHand(initialState.hand, initialState.isMyTurn);
            uiManager.updateAP(initialState.ap, initialState.maxAP);
            uiManager.updateTurnStatus(initialState.isMyTurn);
            
            if (deckCountDisplay) deckCountDisplay.textContent = initialState.deckCount;
        },
        onDataReceived: (data) => {
            console.log('接收到同步指令:', data);
            
            if (data.action === 'PLAY_CARD') {
                gameEngine.syncOpponentPlay(data.targetX, data.targetY, data.cardName, data.cardType);
                uiManager.renderBoard(gameEngine.getState().board);
            } 
            else if (data.action === 'END_TURN') {
                const state = gameEngine.startTurn();
                uiManager.updateTurnStatus(state.isMyTurn);
                uiManager.updateAP(state.ap, state.maxAP);
                uiManager.renderHand(state.hand, state.isMyTurn); 
                if (deckCountDisplay) deckCountDisplay.textContent = state.deckCount;
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
