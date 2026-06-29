// ==========================================================================
// 🚨 Firebaseの機能をインターネットから読み込む設定
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ⚠️あなたの「秘密の鍵」
const firebaseConfig = {
    apiKey: "AIzaSyB39eq-VQP8fZNjVdm7BnO7gKEMBibqqDo",
    authDomain: "hana-kehai-app.firebaseapp.com",
    databaseURL: "https://hana-kehai-app-default-rtdb.firebaseio.com", 
    projectId: "hana-kehai-app",
    storageBucket: "hana-kehai-app.firebasestorage.app",
    messagingSenderId: "144341858428",
    appId: "1:144341858428:web:3adb2679fad549895171f9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ==========================================================================
// 🚨 URLからお部屋の名前と自分の名前を読み取る設定
// ==========================================================================
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const myId = urlParams.get('myname');

// 💡【新機能】部屋名か名前が空っぽなら、ログイン画面を表示して処理をストップする！
if (!roomId || !myId) {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    });
} else {
    // 部屋名と名前がある時だけ、いつものお部屋を表示する！
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    });
}

// ==========================================================================
// 🔑 【新機能】ログイン＆招待リンク生成の処理
// ==========================================================================

// 💡 世界にひとつだけの招待URLとジャンプ先を一時的に保存しておく変数
let generatedInviteUrl = "";
let nextJumpUrl = "";

// 💡 1つ目のボタン：入力内容をチェックして招待画面をポッと出す
window.loginToRoom = function() {
    const roomInput = document.getElementById('input-room').value.trim();
    const nameInput = document.getElementById('input-name').value.trim();
    
    if (!roomInput || !nameInput) {
        alert('お部屋の名前と、あなたの名前を入力してね！');
        return;
    }
    
    // 相手に送る用のベースURLを自動で作るよ（?room=部屋名 だけが入った状態）
    const baseUrl = window.location.origin + window.location.pathname;
    generatedInviteUrl = `${baseUrl}?room=${encodeURIComponent(roomInput)}`;
    
    // 自分が後で入る用のURLもキープしておくよ（?room=部屋名&myname=自分の名前）
    nextJumpUrl = `${baseUrl}?room=${encodeURIComponent(roomInput)}&myname=${encodeURIComponent(nameInput)}`;
    
    // ✨ 魔法の切り替え：入力欄を隠して、招待コピー画面をポッと出す！
    document.getElementById('login-form-fields').style.display = 'none';
    document.getElementById('invite-area').style.display = 'block';
}

// 💡 招待メッセージをクリップボードに自動コピーする魔法
window.copyInviteMessage = function() {
    // 相手にそのまま送れる可愛いメッセージを自動生成！
    const message = `ふたりの「今の気配」がわかるアプリを作ってみたよ！🌸\n\n下のURLを開いて、あなたのお名前を入れるだけで合流できるよ！待ってるね🥰👇\n${generatedInviteUrl}`;
    
    // クリップボードにコピー
    navigator.clipboard.writeText(message).then(() => {
        alert('📋 LINE用の招待メッセージをコピーしたよ！そのまま貼り付けて送ってね。');
    }).catch(err => {
        alert('コピーに失敗しちゃった。文字を直接選択してコピーしてね！');
    });
}

// 💡 2つ目のボタン：コピーした後に自分がお部屋に入る処理
window.goToRoomActual = function() {
    if (nextJumpUrl) {
        window.location.href = nextJumpUrl;
    }
}

==========================================================================
// 🛠️ 共通で使う大事な関数
// ==========================================================================

// 自分のデータをFirebaseに送信（保存）する共通関数
function saveDataToServer(messageText, effectEmoji) {
    const currentAvatarSrc = document.getElementById('my-avatar-preview').src;
    
    const statusElement = document.getElementById('my-current-status');
    if (statusElement) {
        statusElement.innerText = messageText;
    }
    
    set(myRef, {
        avatar: currentAvatarSrc,
        message: messageText,
        effect: effectEmoji || "",
        checked: false
    }).then(() => {
        console.log("Firebaseへの送信に成功！:", messageText);
    }).catch((error) => {
        console.error("Firebaseへの送信でエラー:", error);
    });
}

// エフェクトを画面に出す関数
function triggerEffect(emojis) {
    const effectLayer = document.getElementById('effect-layer');
    if (!effectLayer) return;
    
    const effectDiv = document.createElement('div');
    effectDiv.className = 'floating-effect';
    effectDiv.innerText = emojis;
    effectLayer.appendChild(effectDiv);
    setTimeout(() => { effectDiv.remove(); }, 2000);
}

// ポップアップ開閉
window.openAvatarModal = function() { document.getElementById('avatar-modal').style.display = 'flex'; }
window.closeAvatarModal = function() { document.getElementById('avatar-modal').style.display = 'none'; }

// ==========================================================================
// 📡 【進化版】部屋にいる「自分以外の人（相手）」を自動で見つけて画面に映す
// ==========================================================================
onValue(roomRef, (snapshot) => {
    const allUsersData = snapshot.val();
    if (allUsersData) {
        // 部屋にいる全員の名前リストを取り出して、自分以外の人の名前（partnerId）を探す
        const userNames = Object.keys(allUsersData);
        const partnerId = userNames.find(name => name !== myId);
        
        // もし自分以外の相手が見つかったら、その人のデータを画面の上半分に映す！
        if (partnerId) {
            const partnerData = allUsersData[partnerId];
            
            // 相手の名前を画面に表示（〇〇のいま を書き換える）
            document.querySelector('#partner-area h2').innerText = `${partnerId} のいま`;
            
            if (partnerData.avatar) {
                document.getElementById('partner-avatar').src = partnerData.avatar;
            }
            if (partnerData.message) {
                document.getElementById('partner-message').innerText = partnerData.message;
            }
            if (partnerData.effect && partnerData.checked === false) {
                triggerEffect(partnerData.effect);
                // 相手が送ってきたエフェクトを「既読（true）」にする
                set(ref(database, `rooms/${roomId}/users/${partnerId}/checked`), true);
            }
        }
    }
});

// ==========================================================================
// 3. 状態ボタンを押した時の処理
// ==========================================================================
window.changeStatus = function(statusText) {
    let effect = "";
    if (statusText.includes('まったり')) effect = '☕️🍀🏠';
    else if (statusText.includes('仕事頑張ってる')) effect = '🔥💪😤';
    else if (statusText.includes('パソコン')) effect = '💻👀⚡️';
    else if (statusText.includes('おやつ')) effect = '🍰🍩🧋';
    else if (statusText.includes('寝るね')) effect = '🌙💤⭐️';
    else if (statusText.includes('愛してる')) effect = '❤️❤️❤️';
    else if (statusText.includes('大好き')) effect = '💖✨💘';

    triggerEffect(effect);
    saveDataToServer(statusText, effect);
}
// ==========================================================================
// 4. 自由入力のメッセージ送信
// ==========================================================================
window.sendStatus = function() {
    const messageInput = document.getElementById('my-message-text');
    if (messageInput.value.trim() === "") {
        alert("メッセージを入力してね！");
        return;
    }
    document.getElementById('my-current-status').innerText = messageInput.value;
    triggerEffect('✨🎉✨');
    saveDataToServer(messageInput.value, '✨🎉✨');
    messageInput.value = "";
}

// ==========================================================================
// 5. アバター変更（プリセット）
// ==========================================================================
window.selectPresetAvatar = function(avatarName) {
    if (!checkUploadLimit()) return;
    document.getElementById('my-avatar-preview').src = `image/${avatarName}.png`;
    
    const currentMsg = "アバターを変えたよ";
    saveDataToServer(currentMsg, "");
    
    reduceUploadCount();
    closeAvatarModal();
}

// ==========================================================================
// 6. アバター変更（写真アップロード）
// ==========================================================================
window.uploadMyAvatarPhoto = function() {
    if (!checkUploadLimit()) return;
    const fileInput = document.getElementById('avatar-file-input');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('my-avatar-preview').src = e.target.result;
            saveDataToServer("新しい写真アバターにしたよ！", "📸");
            reduceUploadCount();
            closeAvatarModal();
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function checkUploadLimit() {
    if (uploadLimit <= 0) {
        alert("今日のアバター変更枠（3回）を使い切ったよ！");
        closeAvatarModal();
        return false;
    }
    return true;
}

function reduceUploadCount() {
    uploadLimit--;
    document.getElementById('upload-count').innerText = uploadLimit;
}


// ==========================================================================
// 📡 【新機能】ページを開いた時に、自分の最新データをFirebaseから読み込んで復活させる
// ==========================================================================
onValue(myRef, (snapshot) => {
    const myData = snapshot.val();
    if (myData) {
        // 1. 保存されていたメッセージを復活
        if (myData.message) {
            const statusElement = document.getElementById('my-current-status');
            if (statusElement) {
                statusElement.innerText = myData.message;
            }
        }
        // 2. 保存されていたアバター画像を復活
        if (myData.avatar) {
            const avatarElement = document.getElementById('my-avatar-preview');
            if (avatarElement) {
                avatarElement.src = myData.avatar;
            }
        }
    }
});

// ==========================================================================
// 🔍 【追加コード】写真をタップした時に大きく拡大する魔法
// ==========================================================================
window.zoomPhoto = function(element) {
    const modal = document.getElementById('photo-zoom-modal');
    const zoomedImg = document.getElementById('zoomed-photo');
    if (modal && zoomedImg) {
        zoomedImg.src = element.src;
        modal.style.display = 'flex';
    }
}

window.closeZoomModal = function() {
    const modal = document.getElementById('photo-zoom-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==========================================================================
// 📸 【追加コード】インスタ風画面切り替え（タブ機能）の魔法
// ==========================================================================
window.switchTab = function(tabName) {
    const myArea = document.getElementById('my-area');
    const partnerArea = document.getElementById('partner-area');
    const tabMyBtn = document.getElementById('tab-my');
    const tabPartnerBtn = document.getElementById('tab-partner');

    if (tabName === 'my') {
        if (myArea) myArea.style.display = 'block';
        if (partnerArea) partnerArea.style.display = 'none';
        if (tabMyBtn) {
            tabMyBtn.style.color = '#4caf50';
            tabMyBtn.style.borderBottom = '3px solid #4caf50';
        }
        if (tabPartnerBtn) {
            tabPartnerBtn.style.color = '#888';
            tabPartnerBtn.style.borderBottom = '3px solid transparent';
        }
    } else {
        if (myArea) myArea.style.display = 'none';
        if (partnerArea) partnerArea.style.display = 'block';
        if (tabPartnerBtn) {
            tabPartnerBtn.style.color = '#4caf50';
            tabPartnerBtn.style.borderBottom = '3px solid #4caf50';
        }
        if (tabMyBtn) {
            tabMyBtn.style.color = '#888';
            tabMyBtn.style.borderBottom = '3px solid transparent';
        }
    }
}

// アプリを開いた瞬間に、自動で「あいて」のタブを最初に選んでおく魔法
window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.switchTab === 'function') {
        window.switchTab('partner');
    }
});