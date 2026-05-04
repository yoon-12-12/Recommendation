/**
 * [FINAL REVISED SCRIPT] 지훈 대표님 프로젝트 - 안정성 강화 버전
 * 1. 이미지 로드 및 모달 로직을 완전히 제거했습니다.
 * 2. 룰렛 결과는 화면 중앙의 'result-display' 영역에 표시됩니다.
 * 3. 150개의 drinkData와 완벽하게 연동됩니다.
 */

const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const menuList = document.getElementById('menu-list');
const menuCount = document.getElementById('menu-count');
const addInput = document.getElementById('add-input');

let currentFilters = { cat: new Set(['all']), type: new Set(['all']) };
let isSpinning = false;

// 음료 카테고리에 어울리는 부드러운 컬러 팔레트
const colors = ["#74b9ff", "#81ecec", "#a29bfe", "#fab1a0", "#ff7675", "#fdcb6e", "#55efc4"];

function toggleFilter(filterType, value, btn) {
    if (value === 'all') {
        currentFilters[filterType].clear();
        currentFilters[filterType].add('all');
        btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    } else {
        const allBtn = btn.parentElement.querySelector('button[onclick*="\'all\'"]');
        allBtn.classList.remove('active');
        currentFilters[filterType].delete('all');
        if (currentFilters[filterType].has(value)) {
            currentFilters[filterType].delete(value);
            btn.classList.remove('active');
        } else {
            currentFilters[filterType].add(value);
            btn.classList.add('active');
        }
        if (currentFilters[filterType].size === 0) {
            currentFilters[filterType].add('all');
            allBtn.classList.add('active');
        }
    }
    render();
}

function render() {
    const filtered = drinkData.filter(item => {
        const catMatch = currentFilters.cat.has('all') || currentFilters.cat.has(item.cat);
        const typeMatch = currentFilters.type.has('all') || currentFilters.type.has(item.type);
        return catMatch && typeMatch;
    });
    drawRoulette(filtered);
    updateList(filtered);
}

function drawRoulette(data) {
    const size = canvas.width;
    const center = size / 2;
    ctx.clearRect(0, 0, size, size);
    
    if (data.length === 0) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#ccc";
        ctx.font = "16px Noto Sans KR";
        ctx.fillText("메뉴를 선택해주세요", center, center);
        return;
    }

    const slice = (Math.PI * 2) / data.length;
    data.forEach((item, i) => {
        const angle = i * slice;
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(center, center);
        ctx.arc(center, center, center - 10, angle, angle + slice);
        ctx.fill();
        
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(angle + slice / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 13px Noto Sans KR";
        // 메뉴 이름이 길 경우 생략 표시
        const displayName = item.name.length > 8 ? item.name.substring(0, 7) + ".." : item.name;
        ctx.fillText(displayName, center - 40, 5);
        ctx.restore();
    });
}

function updateList(data) {
    menuList.innerHTML = '';
    menuCount.innerText = data.length;
    data.forEach(item => {
        const li = document.createElement('li');
        // 카테고리별 테마 색상을 작은 점으로 표시
        li.innerHTML = `<span style="display:inline-block; width:10px; height:10px; background:${item.color}; border-radius:50%; margin-right:8px;"></span>
                        <span>${item.name}</span>`;
        menuList.appendChild(li);
    });
}

function spinRoulette() {
    if (isSpinning) return;

    const filtered = drinkData.filter(item => {
        const catMatch = currentFilters.cat.has('all') || currentFilters.cat.has(item.cat);
        const typeMatch = currentFilters.type.has('all') || currentFilters.type.has(item.type);
        return catMatch && typeMatch;
    });

    if (filtered.length < 2) return alert("메뉴를 2개 이상 선택해주세요!");

    isSpinning = true;
    
    // 결과창 숨기기
    document.getElementById('result-display').style.display = 'none';

    const randomRotate = 3600 + Math.random() * 3600;
    canvas.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)';
    canvas.style.transform = `rotate(${randomRotate}deg)`;

    setTimeout(() => {
        isSpinning = false;
        
        // 룰렛 화살표 위치 계산 (12시 방향 기준)
        const actualDeg = randomRotate % 360;
        const sliceDeg = 360 / filtered.length;
        // 화살표가 가리키는 인덱스 계산 (270도 보정)
        const winningIdx = Math.floor((360 - (actualDeg % 360) + 270) % 360 / sliceDeg);
        
        showTextResult(filtered[winningIdx]);
    }, 4000);
}

// 이미지/모달 없이 결과를 화면에 표시하는 핵심 함수
function showTextResult(item) {
    const resultArea = document.getElementById('result-display');
    const resultName = document.getElementById('result-name');
    
    resultArea.style.display = 'block';
    resultArea.style.borderColor = item.color; // 음료의 상징색으로 테두리 강조
    resultName.innerText = item.name;
    resultName.style.color = item.color;
    
    // 네이버 검색 버튼 연결
    const searchBtn = document.createElement('button');
    searchBtn.className = 'filter-btn';
    searchBtn.style.marginTop = '10px';
    searchBtn.innerText = "🔍 정보 더보기";
    searchBtn.onclick = () => {
        window.open(`https://search.naver.com/search.naver?query=${item.name}`, '_blank');
    };
    
    // 기존 버튼 중복 방지를 위해 초기화 후 추가
    const existingBtn = resultArea.querySelector('.search-btn-custom');
    if(existingBtn) existingBtn.remove();
    searchBtn.classList.add('search-btn-custom');
    resultArea.appendChild(searchBtn);

    resultArea.scrollIntoView({ behavior: 'smooth' });
}

function addNewMenu() {
    const name = addInput.value.trim();
    if (name) {
        drinkData.push({ 
            name: name, 
            cat: 'etc', 
            type: 'etc', 
            color: '#ccc', 
            desc: '사용자 추가 메뉴' 
        });
        addInput.value = '';
        render();
    }
}

document.addEventListener('DOMContentLoaded', render);