// 大哥斗地主 - 主要游戏逻辑

// 卡牌类
class Card {
    constructor(suit, rank, id) {
        this.suit = suit; // 花色: ♠, ♥, ♦, ♣, 🃏
        this.rank = rank; // 点数: 3-10, J, Q, K, A, 2, 小王, 大王
        this.id = id; // 唯一标识符
        this.selected = false;
    }

    getDisplayText() {
        if (this.rank === '小王') return '🃏';
        if (this.rank === '大王') return '🃏';
        return this.suit + this.rank;
    }

    getColor() {
        if (this.suit === '♥' || this.suit === '♦') return 'text-red-500';
        if (this.suit === '♠' || this.suit === '♣') return 'text-gray-900';
        return 'text-yellow-500'; // 王
    }

    getNumericValue() {
        const rankValues = {
            '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, '小王': 16, '大王': 17
        };
        return rankValues[this.rank] || 0;
    }

    isJoker() {
        return this.rank === '小王' || this.rank === '大王';
    }
}

// 牌型识别类
class CardPattern {
    static TYPES = {
        ERROR: -1,
        NULL: 0,
        SINGLE: 1, // 单张
        PAIR: 2, // 对子
        TRIPLE: 3, // 三张
        TRIPLE_WITH_SINGLE: 4, // 三带一
        TRIPLE_WITH_PAIR: 5, // 三带二
        STRAIGHT: 6, // 顺子
        DOUBLE_STRAIGHT: 7, // 连对
        TRIPLE_STRAIGHT: 8, // 飞机
        BOMB: 9, // 炸弹
        JOKER_BOMB: 10 // 王炸
    };

    static analyze(cards) {
        if (!cards || cards.length === 0) {
            return { type: this.TYPES.NULL, value: 0, cards: [] };
        }

        cards.sort((a, b) => a.getNumericValue() - b.getNumericValue());

        // 统计每张牌的数量
        const counts = {};
        cards.forEach(card => {
            const key = card.getNumericValue();
            counts[key] = (counts[key] || 0) + 1;
        });

        const countValues = Object.values(counts).sort((a, b) => b - a);
        const uniqueCount = Object.keys(counts).length;

        // 王炸
        if (cards.length === 2 && cards.every(card => card.isJoker())) {
            return { type: this.TYPES.JOKER_BOMB, value: 100, cards };
        }

        // 炸弹
        if (countValues[0] === 4) {
            const value = cards[0].getNumericValue();
            return { type: this.TYPES.BOMB, value: value * 10, cards };
        }

        // 单张
        if (cards.length === 1) {
            return { type: this.TYPES.SINGLE, value: cards[0].getNumericValue(), cards };
        }

        // 对子
        if (cards.length === 2 && countValues[0] === 2) {
            return { type: this.TYPES.PAIR, value: cards[0].getNumericValue(), cards };
        }

        // 三张
        if (cards.length === 3 && countValues[0] === 3) {
            return { type: this.TYPES.TRIPLE, value: cards[0].getNumericValue(), cards };
        }

        // 三带一
        if (cards.length === 4 && countValues[0] === 3 && countValues[1] === 1) {
            const tripleValue = Object.keys(counts).find(key => counts[key] === 3);
            return { type: this.TYPES.TRIPLE_WITH_SINGLE, value: parseInt(tripleValue), cards };
        }

        // 三带二
        if (cards.length === 5 && countValues[0] === 3 && countValues[1] === 2) {
            const tripleValue = Object.keys(counts).find(key => counts[key] === 3);
            return { type: this.TYPES.TRIPLE_WITH_PAIR, value: parseInt(tripleValue), cards };
        }

        // 顺子 (至少5张)
        if (cards.length >= 5 && this.isStraight(cards)) {
            return { type: this.TYPES.STRAIGHT, value: cards[cards.length - 1].getNumericValue(), cards };
        }

        // 连对 (至少3对)
        if (cards.length >= 6 && cards.length % 2 === 0 && this.isDoubleStraight(cards)) {
            return { type: this.TYPES.DOUBLE_STRAIGHT, value: cards[cards.length - 1].getNumericValue(), cards };
        }

        return { type: this.TYPES.ERROR, value: 0, cards };
    }

    static isStraight(cards) {
        for (let i = 1; i < cards.length; i++) {
            if (cards[i].getNumericValue() - cards[i - 1].getNumericValue() !== 1) {
                return false;
            }
        }
        return true;
    }

    static isDoubleStraight(cards) {
        for (let i = 0; i < cards.length; i += 2) {
            if (i + 1 < cards.length && cards[i].getNumericValue() !== cards[i + 1].getNumericValue()) {
                return false;
            }
            if (i + 2 < cards.length && cards[i + 2].getNumericValue() - cards[i].getNumericValue() !== 1) {
                return false;
            }
        }
        return true;
    }

    static canBeat(pattern1, pattern2) {
        // 任何牌型都可以压过空牌型（不出）
        if (pattern2.type === this.TYPES.NULL) return true;

        // 王炸最大
        if (pattern1.type === this.TYPES.JOKER_BOMB) return true;
        if (pattern2.type === this.TYPES.JOKER_BOMB) return false;

        // 炸弹可以压过任何非炸弹牌型
        if (pattern1.type === this.TYPES.BOMB && pattern2.type !== this.TYPES.BOMB) return true;
        if (pattern2.type === this.TYPES.BOMB && pattern1.type !== this.TYPES.BOMB) return false;

        // 炸弹之间比较
        if (pattern1.type === this.TYPES.BOMB && pattern2.type === this.TYPES.BOMB) {
            return pattern1.value > pattern2.value;
        }

        // 同类型牌型比较
        if (pattern1.type === pattern2.type && pattern1.cards.length === pattern2.cards.length) {
            return pattern1.value > pattern2.value;
        }

        return false;
    }
}

// 玩家类
class Player {
    constructor(name, type = 'human') {
        this.name = name;
        this.type = type; // 'human', 'ai'
        this.hand = [];
        this.isLandlord = false;
        this.position = ''; // 'left', 'right', 'bottom'
    }

    addCard(card) {
        this.hand.push(card);
        this.sortHand();
    }

    removeCards(cards) {
        cards.forEach(card => {
            const index = this.hand.findIndex(c => c.id === card.id);
            if (index !== -1) {
                this.hand.splice(index, 1);
            }
        });
    }

    sortHand() {
        this.hand.sort((a, b) => a.getNumericValue() - b.getNumericValue());
    }

    getCardCount() {
        return this.hand.length;
    }

    isEmpty() {
        return this.hand.length === 0;
    }
}

// AI玩家类
class AIPlayer extends Player {
    constructor(name) {
        super(name, 'ai');
    }

    decideCallLandlord() {
        // 简单的叫地主策略：如果手牌中有大牌则叫地主
        const highCards = this.hand.filter(card => card.getNumericValue() >= 12);
        return highCards.length >= 3;
    }

    decidePlayCards(lastPattern) {
        // 获取所有可能的出牌组合
        const possiblePlays = this.getPossiblePlays(lastPattern);
        
        if (possiblePlays.length === 0) {
            return { cards: [], pass: true };
        }

        // 简单的AI策略：选择最小的能压过的牌型
        if (lastPattern && lastPattern.type !== CardPattern.TYPES.NULL) {
            const beatablePlays = possiblePlays.filter(play => 
                CardPattern.canBeat(play, lastPattern)
            );
            
            if (beatablePlays.length > 0) {
                // 选择点数最小的能压过的牌
                beatablePlays.sort((a, b) => a.value - b.value);
                return { cards: beatablePlays[0].cards, pass: false };
            }
            return { cards: [], pass: true };
        }

        // 首次出牌：优先出单张或小对子
        possiblePlays.sort((a, b) => {
            if (a.type !== b.type) return a.type - b.type;
            return a.value - b.value;
        });

        return { cards: possiblePlays[0].cards, pass: false };
    }

    getPossiblePlays(lastPattern) {
        const plays = [];
        
        // 单张
        this.hand.forEach(card => {
            plays.push(CardPattern.analyze([card]));
        });

        // 对子
        for (let i = 0; i < this.hand.length - 1; i++) {
            for (let j = i + 1; j < this.hand.length; j++) {
                if (this.hand[i].getNumericValue() === this.hand[j].getNumericValue()) {
                    plays.push(CardPattern.analyze([this.hand[i], this.hand[j]]));
                }
            }
        }

        // 三张
        const triples = this.findCardsWithCount(3);
        triples.forEach(triple => {
            plays.push(CardPattern.analyze(triple));
        });

        // 三带一
        triples.forEach(triple => {
            this.hand.forEach(card => {
                if (!triple.find(c => c.id === card.id)) {
                    plays.push(CardPattern.analyze([...triple, card]));
                }
            });
        });

        // 炸弹
        const bombs = this.findCardsWithCount(4);
        bombs.forEach(bomb => {
            plays.push(CardPattern.analyze(bomb));
        });

        // 王炸
        const smallJoker = this.hand.find(card => card.rank === '小王');
        const bigJoker = this.hand.find(card => card.rank === '大王');
        if (smallJoker && bigJoker) {
            plays.push(CardPattern.analyze([smallJoker, bigJoker]));
        }

        return plays.filter(play => play.type !== CardPattern.TYPES.ERROR);
    }

    findCardsWithCount(count) {
        const groups = {};
        this.hand.forEach(card => {
            const key = card.getNumericValue();
            if (!groups[key]) groups[key] = [];
            groups[key].push(card);
        });

        return Object.values(groups).filter(group => group.length === count);
    }
}

// 游戏主类
class DouDiZhuGame {
    constructor() {
        this.players = [
            new Player('玩家', 'human'),
            new AIPlayer('智能对手A'),
            new AIPlayer('智能对手B')
        ];
        
        this.deck = [];
        this.landlordCards = [];
        this.currentPlayerIndex = 0;
        this.landlordIndex = -1;
        this.lastPattern = null;
        this.lastPlayerIndex = -1;
        this.gameState = 'waiting'; // waiting, calling, playing, ended
        this.selectedCards = [];
        this.timer = null;
        this.timeLeft = 30;
        
        this.initDeck();
        this.bindEvents();
        this.updateUI();
    }

    initDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        let id = 0;

        // 创建52张牌
        for (let suit of suits) {
            for (let rank of ranks) {
                this.deck.push(new Card(suit, rank, id++));
            }
        }

        // 添加大小王
        this.deck.push(new Card('🃏', '小王', id++));
        this.deck.push(new Card('🃏', '大王', id++));

        // 洗牌
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    startGame() {
        this.resetGame();
        this.dealCards();
        this.startCallingPhase();
    }

    resetGame() {
        this.players.forEach(player => {
            player.hand = [];
            player.isLandlord = false;
        });
        this.landlordCards = [];
        this.currentPlayerIndex = 0;
        this.landlordIndex = -1;
        this.lastPattern = null;
        this.lastPlayerIndex = -1;
        this.gameState = 'waiting';
        this.selectedCards = [];
        this.shuffleDeck();
    }

    dealCards() {
        // 发17张牌给每个玩家
        for (let i = 0; i < 17; i++) {
            this.players.forEach(player => {
                player.addCard(this.deck.pop());
            });
        }

        // 留3张底牌
        this.landlordCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
    }

    startCallingPhase() {
        this.gameState = 'calling';
        this.currentPlayerIndex = 0;
        this.updateGameStatus('叫地主阶段', '请选择是否叫地主');
        this.updateButtons();
        this.updateUI();
    }

    callLandlord(playerIndex) {
        if (this.gameState !== 'calling') return;

        this.landlordIndex = playerIndex;
        this.players[playerIndex].isLandlord = true;
        
        // 地主获得底牌
        this.landlordCards.forEach(card => {
            this.players[playerIndex].addCard(card);
        });

        this.startPlayingPhase();
    }

    passCall() {
        if (this.gameState !== 'calling') return;

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 3;
        
        // 如果一轮都没人叫地主，随机选择
        if (this.currentPlayerIndex === 0) {
            this.callLandlord(Math.floor(Math.random() * 3));
        } else {
            this.updateGameStatus('叫地主阶段', `${this.players[this.currentPlayerIndex].name}选择是否叫地主`);
            this.updateButtons();
        }
    }

    startPlayingPhase() {
        this.gameState = 'playing';
        this.currentPlayerIndex = this.landlordIndex;
        this.lastPattern = null;
        this.lastPlayerIndex = -1;
        this.updateGameStatus('出牌阶段', `${this.players[this.currentPlayerIndex].name}的回合`);
        this.updateButtons();
        this.startTimer();
    }

    playCards(playerIndex, cards) {
        if (this.gameState !== 'playing' || playerIndex !== this.currentPlayerIndex) return;

        const pattern = CardPattern.analyze(cards);
        if (pattern.type === CardPattern.TYPES.ERROR) {
            this.showMessage('无效的牌型！');
            return;
        }

        // 检查是否能压过上家
        if (this.lastPattern && this.lastPlayerIndex !== playerIndex) {
            if (!CardPattern.canBeat(pattern, this.lastPattern)) {
                this.showMessage('无法压过上家的牌！');
                return;
            }
        }

        // 移除玩家手牌
        this.players[playerIndex].removeCards(cards);
        this.lastPattern = pattern;
        this.lastPlayerIndex = playerIndex;

        // 检查游戏是否结束
        if (this.players[playerIndex].isEmpty()) {
            this.endGame(playerIndex);
            return;
        }

        // 下一个玩家
        this.nextPlayer();
    }

    passPlay(playerIndex) {
        if (this.gameState !== 'playing' || playerIndex !== this.currentPlayerIndex) return;

        // 如果上家是自己，不能不出
        if (this.lastPlayerIndex === playerIndex) {
            this.showMessage('您必须出牌！');
            return;
        }

        this.nextPlayer();
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 3;
        
        // 如果一轮都过了，清空lastPattern
        if (this.currentPlayerIndex === this.lastPlayerIndex) {
            this.lastPattern = null;
            this.lastPlayerIndex = -1;
        }

        this.updateGameStatus('出牌阶段', `${this.players[this.currentPlayerIndex].name}的回合`);
        this.updateButtons();
        this.startTimer();

        // AI玩家自动出牌
        if (this.players[this.currentPlayerIndex].type === 'ai') {
            setTimeout(() => this.aiPlay(), 1000);
        }
    }

    aiPlay() {
        const aiPlayer = this.players[this.currentPlayerIndex];
        const decision = aiPlayer.decidePlayCards(this.lastPattern);

        if (decision.pass) {
            this.passPlay(this.currentPlayerIndex);
        } else {
            this.playCards(this.currentPlayerIndex, decision.cards);
        }
    }

    endGame(winnerIndex) {
        this.gameState = 'ended';
        this.stopTimer();
        
        const winner = this.players[winnerIndex];
        const isPlayerWinner = winner.type === 'human';
        
        this.showGameResult(isPlayerWinner, winner.name);
        this.updateGameStats(isPlayerWinner);
    }

    showGameResult(isWinner, winnerName) {
        const modal = document.getElementById('gameResultModal');
        const emoji = document.getElementById('resultEmoji');
        const title = document.getElementById('resultTitle');
        const message = document.getElementById('resultMessage');
        const details = document.getElementById('resultDetails');

        if (isWinner) {
            emoji.textContent = '🎉';
            title.textContent = '胜利！';
            message.textContent = '恭喜您获得胜利！';
            details.textContent = '本局得分: +100';
        } else {
            emoji.textContent = '😢';
            title.textContent = '失败';
            message.textContent = `${winnerName} 获得了胜利！`;
            details.textContent = '本局得分: -50';
        }

        modal.classList.remove('hidden');
    }

    updateGameStats(isWinner) {
        const stats = JSON.parse(localStorage.getItem('doudizhu_stats') || '{"totalGames":0,"winGames":0,"maxStreak":0,"currentStreak":0}');
        
        stats.totalGames++;
        if (isWinner) {
            stats.winGames++;
            stats.currentStreak++;
            if (stats.currentStreak > stats.maxStreak) {
                stats.maxStreak = stats.currentStreak;
            }
        } else {
            stats.currentStreak = 0;
        }
        
        localStorage.setItem('doudizhu_stats', JSON.stringify(stats));
    }

    startTimer() {
        this.stopTimer();
        this.timeLeft = 30;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.timeOut();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    timeOut() {
        this.stopTimer();
        
        if (this.gameState === 'calling') {
            this.passCall();
        } else if (this.gameState === 'playing') {
            if (this.players[this.currentPlayerIndex].type === 'ai') {
                this.aiPlay();
            } else {
                this.showMessage('时间到！自动不出');
                this.passPlay(this.currentPlayerIndex);
            }
        }
    }

    updateTimerDisplay() {
        const circle = document.getElementById('timerCircle');
        const text = document.getElementById('timerText');
        
        if (circle && text) {
            const circumference = 2 * Math.PI * 45;
            const progress = (this.timeLeft / 30) * circumference;
            circle.style.strokeDashoffset = circumference - progress;
            text.textContent = this.timeLeft;
        }
    }

    updateGameStatus(status, message) {
        const statusEl = document.getElementById('gameStatus');
        const messageEl = document.getElementById('gameMessage');
        
        if (statusEl) statusEl.textContent = status;
        if (messageEl) messageEl.textContent = message;
    }

    showMessage(message) {
        // 可以在这里添加更好的消息显示方式
        console.log(message);
    }

    updateButtons() {
        const callBtn = document.getElementById('callLandlordBtn');
        const passCallBtn = document.getElementById('passCallBtn');
        const playBtn = document.getElementById('playCardsBtn');
        const passPlayBtn = document.getElementById('passPlayBtn');
        const hintBtn = document.getElementById('hintBtn');
        const startBtn = document.getElementById('startGameBtn');

        if (this.gameState === 'calling') {
            callBtn.disabled = this.currentPlayerIndex !== 0;
            passCallBtn.disabled = this.currentPlayerIndex !== 0;
            playBtn.disabled = true;
            passPlayBtn.disabled = true;
            hintBtn.disabled = true;
            startBtn.disabled = true;
        } else if (this.gameState === 'playing') {
            callBtn.disabled = true;
            passCallBtn.disabled = true;
            playBtn.disabled = this.currentPlayerIndex !== 0 || this.selectedCards.length === 0;
            passPlayBtn.disabled = this.currentPlayerIndex !== 0;
            hintBtn.disabled = this.currentPlayerIndex !== 0;
            startBtn.disabled = true;
        } else {
            callBtn.disabled = true;
            passCallBtn.disabled = true;
            playBtn.disabled = true;
            passPlayBtn.disabled = true;
            hintBtn.disabled = true;
            startBtn.disabled = false;
        }
    }

    updateUI() {
        this.updatePlayerCards();
        this.updateLandlordCards();
        this.updateGameInfo();
        this.updateButtons();
    }

    updatePlayerCards() {
        const playerHand = document.getElementById('playerHand');
        if (playerHand) {
            playerHand.innerHTML = '';
            this.players[0].hand.forEach(card => {
                const cardEl = document.createElement('div');
                cardEl.classList.add('card', card.getColor(), 'inline-block', 'p-2', 'm-1', 'rounded', 'shadow');
                cardEl.textContent = card.getDisplayText();
                playerHand.appendChild(cardEl);
            });
        }
    }

    updateLandlordCards() {
        const landlordCardsEl = document.getElementById('landlordCards');
        if (landlordCardsEl) {
            landlordCardsEl.innerHTML = '';
            this.landlordCards.forEach(card => {
                const cardEl = document.createElement('div');
                cardEl.classList.add('card', card.getColor(), 'inline-block', 'p-2', 'm-1', 'rounded', 'shadow');
                cardEl.textContent = card.getDisplayText();
                landlordCardsEl.appendChild(cardEl);
            });
        }
    }

    updateGameInfo() {
        const gameInfoEl = document.getElementById('gameInfo');
        if (gameInfoEl) {
            gameInfoEl.innerHTML = `
                <p>玩家手牌数: ${this.players[0].getCardCount()}</p>
                <p>地主手牌数: ${this.players[this.landlordIndex].getCardCount()}</p>
            `;
        }
    }

    bindEvents() {
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('callLandlordBtn').addEventListener('click', () => {
            this.callLandlord(0);
        });

        document.getElementById('passCallBtn').addEventListener('click', () => {
            this.passCall();
        });

        document.getElementById('playCardsBtn').addEventListener('click', () => {
            this.playCards(0, this.selectedCards);
        });

        document.getElementById('passPlayBtn').addEventListener('click', () => {
            this.passPlay(0);
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showMessage('提示功能暂未实现');
        });
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new DouDiZhuGame();
});