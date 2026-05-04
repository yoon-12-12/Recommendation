const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
let selectedCats = new Set();
let selectedTypes = new Set();
let isSpinning = false;

// 룰렛용 파스텔 컬러 팔레트
const colors = ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF", "#FFC6FF"];

document.addEventListener('DOMContentLoaded', () => {
    render();
});

// 중복 선택 필터 로직
function toggleFilter(type, value, btn) {
    const targetSet = type === 'cat' ? selectedCats : selectedTypes;
    const parent = btn.parentElement;

    if (value === 'all') {
        targetSet.clear();
        parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    } else {
        const allBtn = parent.querySelector('button[onclick*="all"]');
        allBtn.classList.remove('active');
        
        if (targetSet.has(value)) {
            targetSet.delete(value);
            btn.classList.remove('active');
        } else {
            targetSet.add(value);
            btn.classList.add('active');
        }

        if (targetSet.size === 0) {
            allBtn.classList.add('active');
        }
    }
    render();
}

function render() {
    const filtered = menuData.filter(m => {
        const catMatch = selectedCats.size === 0 || selectedCats.has(m.cat);
        const typeMatch = selectedTypes.size === 0 || selectedTypes.has(m.type);
        return catMatch && typeMatch;
    });

    drawRoulette(filtered);
    updateList(filtered);
}

// 룰렛 그리기 (텍스트 포함)
function drawRoulette(data) {
    const size = canvas.width;
    const center = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (data.length === 0) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#aaa";
        ctx.font = "16px Noto Sans KR";
        ctx.fillText("조건에 맞는 메뉴가 없습니다.", center, center);
        return;
    }

    const slice = (Math.PI * 2) / data.length;
    data.forEach((m, i) => {
        const angle = i * slice;
        
        // 조각 그리기
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(center, center);
        ctx.arc(center, center, center - 10, angle, angle + slice);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 텍스트 추가
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(angle + slice / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#333";
        ctx.font = "bold 14px Noto Sans KR";
        // 메뉴명이 길 경우 생략
        const name = m.name.length > 8 ? m.name.substring(0, 7) + ".." : m.name;
        ctx.fillText(name, center - 35, 5);
        ctx.restore();
    });
}

function spinRoulette() {
    if (isSpinning) return;
    const data = menuData.filter(m => {
        const catMatch = selectedCats.size === 0 || selectedCats.has(m.cat);
        const typeMatch = selectedTypes.size === 0 || selectedTypes.has(m.type);
        return catMatch && typeMatch;
    });

    if (data.length < 2) return alert("최소 2개 이상의 메뉴가 필요합니다.");

    isSpinning = true;
    const duration = 4000;
    const randomRotate = 3600 + Math.random() * 3600;
    
    canvas.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0, 0.1, 1)`;
    canvas.style.transform = `rotate(${randomRotate}deg)`;

    setTimeout(() => {
        isSpinning = false;
        const actualDeg = randomRotate % 360;
        const sliceDeg = 360 / data.length;
        // 화살표 보정(270도 방향 기준)
        const winningIdx = Math.floor((360 - actualDeg + 270) % 360 / sliceDeg);
        showResult(data[winningIdx] || data[0]);
    }, duration);
}

function updateList(data) {
    const listEl = document.getElementById("menu-list");
    document.getElementById("menu-count").innerText = data.length;
    listEl.innerHTML = data.map(m => `
        <li>
            <span>${m.name} <small style="color:#999">(${m.cat})</small></span>
            <button class="del-btn" onclick="deleteMenu(${m.id})">삭제</button>
        </li>
    `).join('');
}

async function showResult(winner) {
    const modal = document.getElementById("resultModal");
    const modalImg = document.getElementById("foodImage");
    const loaderText = document.getElementById("loaderText");
    
    document.getElementById("modalFoodName").innerText = `🎉 오늘은 ${winner.name}!`;
    modalImg.style.display = "none";
    loaderText.style.display = "block";

    try {
        const wikiUrl = `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(winner.name)}`;
        const res = await fetch(wikiUrl);
        const data = await res.json();
        modalImg.src = data.thumbnail ? data.thumbnail.source : `https://loremflickr.com/500/400/${encodeURIComponent(winner.name)},food/all`;
    } catch {
        modalImg.src = `https://loremflickr.com/500/400/${encodeURIComponent(winner.name)},dish/all`;
    }

    modalImg.onload = () => {
        modalImg.style.display = "block";
        loaderText.style.display = "none";
    };

    document.getElementById("search-more-btn").onclick = () => window.open(`https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(winner.name)}`);
    modal.style.display = "flex";
}

function addNewMenu() {
    const input = document.getElementById("add-input");
    const name = input.value.trim();
    if (!name) return alert("이름을 입력하세요!");
    
    menuData.push({ id: Date.now(), name, cat: 'etc', type: 'etc' });
    input.value = "";
    render();
}

function deleteMenu(id) {
    const idx = menuData.findIndex(m => m.id === id);
    if (idx > -1) {
        menuData.splice(idx, 1);
        render();
    }
}

function closeModal() {
    document.getElementById("resultModal").style.display = "none";
    canvas.style.transition = "none";
    canvas.style.transform = "rotate(0deg)";
}