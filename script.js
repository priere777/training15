import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEPTqVXUULft96jWh4A7sVD7WoUiMcP4k",
  authDomain: "weather-app-752b7.firebaseapp.com",
  projectId: "weather-app-752b7",
  storageBucket: "weather-app-752b7.firebasestorage.app",
  messagingSenderId: "349566198908",
  appId: "1:349566198908:web:00e5d742e2ce1043e8455f9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const postBtn = document.getElementById('post-btn');
const hackList = document.getElementById('hack-list');
const imageInput = document.getElementById('hack-image');
const previewArea = document.getElementById('image-preview');

let selectedImageData = "";
let currentFilter = "all";
let latestSnapshot = null; // 取得したデータを一時保存する場所

// 1. 画像プレビュー表示
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        selectedImageData = event.target.result;
        previewArea.innerHTML = `<img src="${selectedImageData}">`;
    };
    reader.readAsDataURL(file);
});

// 2. 投稿機能
postBtn.addEventListener('click', async () => {
    const title = document.getElementById('hack-title').value;
    const content = document.getElementById('hack-content').value;
    const category = document.getElementById('hack-category').value;

    if (title && content) {
        await addDoc(collection(db, "hacks"), {
            title, content, category,
            image: selectedImageData,
            likes: 0,
            createdAt: new Date()
        });
        document.getElementById('hack-title').value = "";
        document.getElementById('hack-content').value = "";
        previewArea.innerHTML = "";
        selectedImageData = "";
    }
});

// 3. 描画処理（共通関数）
function render(snapshot) {
    hackList.innerHTML = "";
    snapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();
        const id = snapshotDoc.id;

        // 絞り込み判定
        if (currentFilter !== "all" && data.category !== currentFilter) return;

        const card = document.createElement('div');
        card.className = 'hack-card';
        const imgTag = data.image ? `<img src="${data.image}" class="card-thumb" onclick="window.openModal('${data.image}')">` : "";

        card.innerHTML = `
            <div class="card-left">
                <span class="category-tag">${data.category}</span>
                <h3>${data.title}</h3>
                <p>${data.content}</p>
                <div class="card-footer">
                    <button class="like-btn" id="like-${id}">❤️ ${data.likes || 0}</button>
                    <button class="delete-btn" id="del-${id}">削除</button>
                </div>
            </div>
            ${imgTag}
        `;
        hackList.appendChild(card);

        // イベント登録
        document.getElementById(`like-${id}`).onclick = () => updateDoc(doc(db, "hacks", id), { likes: increment(1) });
        document.getElementById(`del-${id}`).onclick = () => confirm("削除しますか？") && deleteDoc(doc(db, "hacks", id));
    });
}

// 4. 絞り込みボタンのイベント設定
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-category');
        
        // データを再描画
        if (latestSnapshot) render(latestSnapshot);
    });
});

// 5. リアルタイム監視
onSnapshot(query(collection(db, "hacks"), orderBy("createdAt", "desc")), (snapshot) => {
    latestSnapshot = snapshot; // データをキャッシュする
    render(snapshot);
});

// 6. モーダル処理
window.openModal = (src) => {
    const modal = document.getElementById('image-modal');
    document.getElementById('full-image').src = src;
    modal.style.display = "flex";
};
document.querySelector('.close-modal').onclick = () => document.getElementById('image-modal').style.display = "none";
window.onclick = (event) => {
    const modal = document.getElementById('image-modal');
    if (event.target == modal) modal.style.display = "none";
};