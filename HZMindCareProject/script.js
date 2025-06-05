// script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // --- i18next 전역 객체 ---
    const i18n = window.i18next;
    const i18nextHttpBackend = window.i18nextHttpBackend;
    const i18nextBrowserLanguageDetector = window.i18nextBrowserLanguageDetector;

    // --- DOM 요소 가져오기 ---
    const goalSelect = document.getElementById('goal-select');
    const manualSettingsDiv = document.getElementById('manual-settings');
    const manualTypeSelect = document.getElementById('manual-type-select');
    const targetFreqLabel = document.getElementById('target-freq-label');
    const targetFreqInput = document.getElementById('target-freq-input');
    const baseToneGroup = document.getElementById('base-tone-group'); // baseToneLabel 대신 그룹 전체를 참조
    const baseToneInput = document.getElementById('base-tone-input');
    const masterVolumeInput = document.getElementById('master-volume');
    const whiteNoiseToggle = document.getElementById('white-noise-toggle');
    const whiteNoiseVolumeInput = document.getElementById('white-noise-volume');
    const playPauseButton = document.getElementById('play-pause-button');
    const currentSoundInfo = document.getElementById('current-sound-info');
    const soundEffectInfo = document.getElementById('sound-effect-info');
    const scientificSourceDiv = document.getElementById('scientific-source');
    const tooltipTextSpan = scientificSourceDiv.querySelector('.tooltip-text');
    const langEnButton = document.getElementById('lang-en');
    const langKoButton = document.getElementById('lang-ko');

    // --- 오디오 관련 변수 ---
    let audioCtx;
    let masterGain;
    let oscillatorLeft, oscillatorRight;
    let whiteNoiseNode, whiteNoiseGain;
    let isPlaying = false;
    const DEFAULT_BASE_TONE = 100;

    // --- 원본 추천 프리셋 데이터 (i18next 키를 포함하도록 수정) ---
    // 이 데이터는 이제 번역 키를 참조합니다. 실제 텍스트는 translation.json 파일에 있습니다.
    const PRESETS_CONFIG = {
        manual: { categoryKey: "category_manual", typeKey: "preset.manual.type", effectKey: "preset.manual.effect", source: "" },
        sleep_delta_3hz: { categoryKey: "category_brainwave_binaural", effectHz: 3, baseTone: 90, typeKey: "preset.sleep_delta_3hz.type", effectKey: "preset.sleep_delta_3hz.effect", source: "frontiersin.org, choosemuse.com" },
        meditation_theta_6hz: { categoryKey: "category_brainwave_binaural", effectHz: 6, baseTone: 100, typeKey: "preset.meditation_theta_6hz.type", effectKey: "preset.meditation_theta_6hz.effect", source: "sleepfoundation.org, choosemuse.com" },
        relax_alpha_10hz: { categoryKey: "category_brainwave_binaural", effectHz: 10, baseTone: 100, typeKey: "preset.relax_alpha_10hz.type", effectKey: "preset.relax_alpha_10hz.effect", source: "medicalnewstoday.com, choosemuse.com" },
        focus_beta_15hz: { categoryKey: "category_brainwave_binaural", effectHz: 15, baseTone: 120, typeKey: "preset.focus_beta_15hz.type", effectKey: "preset.focus_beta_15hz.effect", source: "medicalnewstoday.com" },
        memory_beta_18hz: { categoryKey: "category_brainwave_binaural", effectHz: 18, baseTone: 120, typeKey: "preset.memory_beta_18hz.type", effectKey: "preset.memory_beta_18hz.effect", source: "medicalnewstoday.com" },
        peak_gamma_40hz: { categoryKey: "category_brainwave_binaural", effectHz: 40, baseTone: 150, typeKey: "preset.peak_gamma_40hz.type", effectKey: "preset.peak_gamma_40hz.effect", source: "choosemuse.com, news.mit.edu" },
        schumann_7_83hz: { categoryKey: "category_special_binaural", effectHz: 7.83, baseTone: 90, typeKey: "preset.schumann_7_83hz.type", effectKey: "preset.schumann_7_83hz.effect", source: "chiangmaiholistic.com" },
        tuning_432hz: { categoryKey: "category_special_single_tone", singleHz: 432, typeKey: "preset.tuning_432hz.type", effectKey: "preset.tuning_432hz.effect", source: "pmc.ncbi.nlm.nih.gov (일부 연구)" },
        solfeggio_174hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 174, typeKey: "preset.solfeggio_174hz.type", effectKey: "preset.solfeggio_174hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_285hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 285, typeKey: "preset.solfeggio_285hz.type", effectKey: "preset.solfeggio_285hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_396hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 396, typeKey: "preset.solfeggio_396hz.type", effectKey: "preset.solfeggio_396hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_417hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 417, typeKey: "preset.solfeggio_417hz.type", effectKey: "preset.solfeggio_417hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_528hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 528, typeKey: "preset.solfeggio_528hz.type", effectKey: "preset.solfeggio_528hz.effect", source: "zenmix.io, scirp.org (일부 연구)" },
        solfeggio_639hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 639, typeKey: "preset.solfeggio_639hz.type", effectKey: "preset.solfeggio_639hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_741hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 741, typeKey: "preset.solfeggio_741hz.type", effectKey: "preset.solfeggio_741hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_852hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 852, typeKey: "preset.solfeggio_852hz.type", effectKey: "preset.solfeggio_852hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_963hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 963, typeKey: "preset.solfeggio_963hz.type", effectKey: "preset.solfeggio_963hz.effect", source: "zenmix.io (솔페지오 이론)" },
    };

    // --- i18next 초기화 함수 ---
    async function initI18next() {
        if (!i18n || !i18nextHttpBackend || !i18nextBrowserLanguageDetector) {
            console.error("i18next libraries not loaded!");
            // i18next 실패 시에도 UI는 기본값으로 빌드 시도
            buildGoalSelectStructure(); // 구조는 만들고
            updateAllTexts(); // 텍스트는 기본값으로
            return;
        }
        await i18n
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                fallbackLng: 'en', // 한국어 외에는 기본 영어가 되도록 설정
                supportedLngs: ['ko', 'en'], // 지원하는 언어 명시
                debug: true,
                detection: {
                    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
                    caches: ['localStorage', 'cookie'],
                    // 한국어 브라우저 사용자는 'ko', 그 외는 'en'으로 감지되도록 시도
                    // (실제로는 detector가 알아서 하지만, fallbackLng: 'en'이 중요)
                },
                backend: {
                    loadPath: 'locales/{{lng}}/translation.json',
                },
                interpolation: {
                    escapeValue: false // React가 이미 XSS 방지
                }
            });
        
        console.log("i18next initialized. Detected language:", i18n.language);
        document.documentElement.lang = i18n.language.split('-')[0]; // html lang 속성 업데이트 (ko 또는 en)
        
        buildGoalSelectStructure(); // <select> 태그의 구조를 먼저 만듦
        updateAllTexts();           // 모든 텍스트 업데이트 (select 포함)
        updateActiveLangButton();   // 활성 언어 버튼 스타일 업데이트

        // 언어 변경 시 이벤트 리스너
        i18n.on('languageChanged', (lng) => {
            console.log("Language changed to:", lng);
            document.documentElement.lang = lng.split('-')[0];
            updateAllTexts();
            updateActiveLangButton();
        });
    }

    // --- 모든 텍스트 업데이트 함수 (data-i18n 속성 및 동적 텍스트) ---
    function updateAllTexts() {
        console.log("Updating all texts for language:", i18n.language);
        // 1. data-i18n 속성이 있는 모든 요소 업데이트
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && i18n.exists(key)) {
                const translation = i18n.t(key);
                if (el.tagName === 'TITLE') document.title = translation;
                else if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') || el.tagName === 'BUTTON') el.textContent = translation;
                // placeholder는 updateManualSettingsUI에서 개별 처리
                else el.innerHTML = translation;
            } else if (key) {
                console.warn(`Translation key "${key}" not found for element:`, el);
            }
        });

        // 2. 추천 사운드 <select> 내부 텍스트 업데이트
        updateGoalSelectTexts();

        // 3. 동적으로 변경되는 텍스트 업데이트
        if(playPauseButton) playPauseButton.textContent = isPlaying ? i18n.t('button_pause') : i18n.t('button_play');
        if(manualTypeSelect) updateManualSettingsUI(manualTypeSelect.value); // 수동 설정 UI 레이블/플레이스홀더 업데이트
        
        // 4. 현재 재생 정보 업데이트
        if (!isPlaying && goalSelect && PRESETS_CONFIG) {
            updateInfoDisplayFromPreset(goalSelect.value);
        } else if (isPlaying && goalSelect && PRESETS_CONFIG) { // 재생 중 언어 변경 시 정보 업데이트
            const currentPresetKey = goalSelect.value;
            const preset = PRESETS_CONFIG[currentPresetKey];
            let displayInfoText, effectInfoKey, sourceInfo;
             if (currentPresetKey === "manual") {
                const manualType = manualTypeSelect.value;
                const targetFreq = parseFloat(targetFreqInput.value);
                const baseTone = parseFloat(baseToneInput.value) || DEFAULT_BASE_TONE;
                effectInfoKey = preset.effectKey;
                sourceInfo = preset.source;
                if (manualType === "binaural") {
                    displayInfoText = i18n.t('info_manual_binaural_format', { targetFreq: targetFreq.toFixed(2), baseTone: baseTone.toFixed(2) });
                } else {
                    displayInfoText = i18n.t('info_manual_single_tone_format', { targetFreq: targetFreq.toFixed(2) });
                }
            } else if (preset) {
                displayInfoText = i18n.t(preset.typeKey); // preset.typeKey 자체가 번역 키
                effectInfoKey = preset.effectKey;
                sourceInfo = preset.source;
            }
            if(displayInfoText) updateInfoDisplay(displayInfoText, effectInfoKey, sourceInfo);
        } else if (!isPlaying && currentSoundInfo) { // 기본 대기 메시지
            currentSoundInfo.textContent = i18n.t('info_waiting_selection');
        }
    }
    
    // --- 추천 사운드 <select> 구조 생성 함수 (페이지 로드 시 1회) ---
    function buildGoalSelectStructure() {
        if (!goalSelect || !PRESETS_CONFIG) {
            console.error("Cannot build goal select: missing element or PRESETS_CONFIG.");
            if(goalSelect) goalSelect.innerHTML = `<option value="">Error loading presets</option>`;
            return;
        }
        console.log("Building goal select structure...");
        goalSelect.innerHTML = ''; // 기존 옵션 완전 초기화

        const categories = {};
        for (const key in PRESETS_CONFIG) {
            const preset = PRESETS_CONFIG[key];
            const categoryKey = preset.categoryKey; // 번역 키
            if (!categories[categoryKey]) {
                categories[categoryKey] = [];
            }
            categories[categoryKey].push({ key, preset });
        }

        const categoryOrderKeys = ["category_manual", "category_brainwave_binaural", "category_solfeggio_single_tone", "category_special_binaural", "category_special_single_tone"];
        const sortedCategoryKeys = [...categoryOrderKeys, ...Object.keys(categories).filter(k => !categoryOrderKeys.includes(k))];

        sortedCategoryKeys.forEach(categoryKey => {
            if (categories[categoryKey]) {
                const optgroup = document.createElement('optgroup');
                optgroup.setAttribute('data-i18n-label', categoryKey); // 번역될 레이블의 키 저장
                categories[categoryKey].forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.key;
                    option.setAttribute('data-i18n-text', item.preset.typeKey); // 번역될 텍스트의 키 저장
                    optgroup.appendChild(option);
                });
                goalSelect.appendChild(optgroup);
            }
        });
        goalSelect.value = "manual"; // 기본 선택
        console.log("Goal select structure built.");
    }

    // --- 추천 사운드 <select> 내부 텍스트만 업데이트하는 함수 ---
    function updateGoalSelectTexts() {
        if (!goalSelect || !i18n || !i18n.isInitialized) return;
        console.log("Updating goal select texts...");
        Array.from(goalSelect.getElementsByTagName('optgroup')).forEach(optgroup => {
            const labelKey = optgroup.getAttribute('data-i18n-label');
            if (labelKey && i18n.exists(labelKey)) optgroup.label = i18n.t(labelKey);
        });
        Array.from(goalSelect.options).forEach(option => {
            const textKey = option.getAttribute('data-i18n-text');
            if (textKey && i18n.exists(textKey)) option.textContent = i18n.t(textKey);
        });
        console.log("Goal select texts updated.");
    }

    // --- 수동 설정 UI 업데이트 함수 ---
    function updateManualSettingsUI(type) {
        if (!targetFreqLabel || !targetFreqInput || !baseToneGroup || !i18n || !i18n.isInitialized) return;
        
        const binauralLabelKey = 'label_target_freq_binaural';
        const singleToneLabelKey = 'label_target_freq_single_tone';
        // HTML에서 data-i18n-placeholder-* 속성을 사용하도록 변경
        const binauralPlaceholderKey = targetFreqLabel.getAttribute('data-i18n-placeholder-binaural'); 
        const singleTonePlaceholderKey = targetFreqLabel.getAttribute('data-i18n-placeholder-single');

        if (type === "binaural") {
            targetFreqLabel.textContent = i18n.t(binauralLabelKey);
            if(binauralPlaceholderKey) targetFreqInput.placeholder = i18n.t(binauralPlaceholderKey);
            baseToneGroup.style.display = 'block';
        } else { // single_tone
            targetFreqLabel.textContent = i18n.t(singleToneLabelKey);
            if(singleTonePlaceholderKey) targetFreqInput.placeholder = i18n.t(singleTonePlaceholderKey);
            baseToneGroup.style.display = 'none';
        }
    }
    
    // --- 슬라이더 트랙 업데이트 ---
    function updateSliderTrack(sliderElement) {
        const value = parseFloat(sliderElement.value);
        const min = parseFloat(sliderElement.min);
        const max = parseFloat(sliderElement.max);
        const percentage = ((value - min) / (max - min)) * 100;
        sliderElement.style.setProperty('--track-fill-percentage', percentage + '%');
    }

    // --- 오디오 초기화 ---
    function initAudio() {
        // ... (이전 원본 코드와 동일하게 유지)
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);
            masterGain.gain.value = parseFloat(masterVolumeInput.value);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.error("Error resuming AudioContext:", e));
        }
    }

    // --- 사운드 재생 ---
    function playSound() {
        // ... (이전 원본 코드 기반으로, 텍스트 부분은 i18n.t() 사용)
        if (!audioCtx || audioCtx.state !== 'running') {
            initAudio();
            if (!audioCtx || audioCtx.state !== 'running') {
                 currentSoundInfo.textContent = i18n.t('info_audio_not_ready_retry');
                 return;
            }
        }
        stopOscillators();

        let leftFreq, rightFreq;
        let displayInfoText, effectInfoKey, sourceInfo;
        const currentPresetKey = goalSelect.value;
        const preset = PRESETS_CONFIG[currentPresetKey];

        if (!preset) {
            console.error("Selected preset not found in PRESETS_CONFIG:", currentPresetKey);
            currentSoundInfo.textContent = i18n.t('info_waiting_selection'); // Or some error
            return;
        }

        if (currentPresetKey === "manual") {
            const manualType = manualTypeSelect.value;
            const targetFreq = parseFloat(targetFreqInput.value);
            const baseTone = parseFloat(baseToneInput.value) || DEFAULT_BASE_TONE;
            effectInfoKey = preset.effectKey; 
            sourceInfo = preset.source;
            if (manualType === "binaural") {
                leftFreq = baseTone;
                rightFreq = baseTone + targetFreq;
                displayInfoText = i18n.t('info_manual_binaural_format', { targetFreq: targetFreq.toFixed(2), baseTone: baseTone.toFixed(2) });
            } else { 
                leftFreq = targetFreq;
                rightFreq = targetFreq;
                displayInfoText = i18n.t('info_manual_single_tone_format', { targetFreq: targetFreq.toFixed(2) });
            }
        } else {
            if (preset.effectHz !== undefined) { 
                leftFreq = preset.baseTone;
                rightFreq = preset.baseTone + preset.effectHz;
            } else if (preset.singleHz !== undefined) { 
                leftFreq = preset.singleHz;
                rightFreq = preset.singleHz;
            }
            displayInfoText = i18n.t(preset.typeKey);
            effectInfoKey = preset.effectKey;
            sourceInfo = preset.source;
        }

        if (isNaN(leftFreq) || isNaN(rightFreq) || leftFreq <= 0 || rightFreq <= 0) {
            currentSoundInfo.textContent = i18n.t('info_invalid_frequency');
            return;
        }

        oscillatorLeft = audioCtx.createOscillator();
        oscillatorRight = audioCtx.createOscillator();
        oscillatorLeft.type = 'sine';
        oscillatorRight.type = 'sine';
        oscillatorLeft.frequency.value = leftFreq;
        oscillatorRight.frequency.value = rightFreq;

        const pannerLeft = audioCtx.createStereoPanner(); pannerLeft.pan.value = -1;
        const pannerRight = audioCtx.createStereoPanner(); pannerRight.pan.value = 1;

        oscillatorLeft.connect(pannerLeft).connect(masterGain);
        oscillatorRight.connect(pannerRight).connect(masterGain);

        try {
            oscillatorLeft.start(audioCtx.currentTime);
            oscillatorRight.start(audioCtx.currentTime);
            isPlaying = true;
            if(playPauseButton) playPauseButton.textContent = i18n.t('button_pause');
        } catch (e) {
            console.error("Error starting oscillators:", e);
            isPlaying = false;
            if(playPauseButton) playPauseButton.textContent = i18n.t('button_play');
            if(currentSoundInfo) currentSoundInfo.textContent = i18n.t('info_audio_error_starting');
            stopOscillators(); return;
        }

        if (whiteNoiseToggle.checked) playWhiteNoise();
        if(displayInfoText) updateInfoDisplay(displayInfoText, effectInfoKey, sourceInfo);
    }

    // --- 오실레이터 정지 ---
    function stopOscillators() { /* ... (원본과 동일) ... */ 
        if (oscillatorLeft) { try { oscillatorLeft.stop(audioCtx.currentTime); } catch (e) {} oscillatorLeft.disconnect(); oscillatorLeft = null; }
        if (oscillatorRight) { try { oscillatorRight.stop(audioCtx.currentTime); } catch (e) {} oscillatorRight.disconnect(); oscillatorRight = null; }
    }

    // --- 사운드 정지 ---
    function stopSound() { /* ... (원본 기반, 텍스트는 i18n.t() 사용) ... */
        stopOscillators();
        stopWhiteNoise();
        isPlaying = false;
        if(playPauseButton) playPauseButton.textContent = i18n.t('button_play');
        if(goalSelect) updateInfoDisplayFromPreset(goalSelect.value); 
    }
    
    // --- 백색 소음 재생/정지 ---
    function playWhiteNoise() { /* ... (원본과 동일) ... */ 
        if (!audioCtx || audioCtx.state !== 'running') return;
        if (whiteNoiseNode) { try { whiteNoiseNode.stop(); } catch(e) {} whiteNoiseNode.disconnect(); }
        const bufferSize = audioCtx.sampleRate; const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
        whiteNoiseNode = audioCtx.createBufferSource(); whiteNoiseNode.buffer = noiseBuffer; whiteNoiseNode.loop = true;
        if (!whiteNoiseGain) whiteNoiseGain = audioCtx.createGain();
        whiteNoiseGain.gain.value = parseFloat(whiteNoiseVolumeInput.value);
        whiteNoiseNode.connect(whiteNoiseGain).connect(masterGain);
        try { whiteNoiseNode.start(audioCtx.currentTime); } catch (e) { console.error("Error starting white noise:", e); }
    }
    function stopWhiteNoise() { /* ... (원본과 동일) ... */
        if (whiteNoiseNode) { try { whiteNoiseNode.stop(audioCtx.currentTime); } catch(e) {} whiteNoiseNode.disconnect(); whiteNoiseNode = null; }
    }

    // --- 정보 표시 업데이트 ---
    function updateInfoDisplay(currentSoundTextOrKey, effectKey, source) {
        if (!currentSoundInfo || !soundEffectInfo || !scientificSourceDiv || !tooltipTextSpan || !i18n || !i18n.isInitialized) return;
        
        let finalCurrentSoundText = currentSoundTextOrKey;
        // currentSoundTextOrKey가 번역 키인지, 아니면 이미 포맷팅된 문자열인지 확인
        if (i18n.exists(currentSoundTextOrKey) && currentSoundTextOrKey.includes('.')) { // 키로 판단 (예: 'preset.manual.type')
            finalCurrentSoundText = i18n.t('info_playing_prefix') + " " + i18n.t(currentSoundTextOrKey);
        } else if (currentSoundTextOrKey.startsWith(i18n.t('info_manual_binaural_format', {targetFreq:'', baseTone:''}).substring(0,3)) ||
                   currentSoundTextOrKey.startsWith(i18n.t('info_manual_single_tone_format', {targetFreq:''}).substring(0,3))) {
            // 이미 포맷팅된 수동 문자열 (예: "수동: ...") - 접두사 없이 바로 사용
            finalCurrentSoundText = currentSoundTextOrKey;
        } else { // 그 외 (오류 또는 알 수 없는 경우)
             finalCurrentSoundText = i18n.t('info_playing_prefix') + " " + currentSoundTextOrKey;
        }
        currentSoundInfo.textContent = finalCurrentSoundText;

        soundEffectInfo.textContent = i18n.t('info_effect_prefix') + " " + (effectKey && i18n.exists(effectKey) ? i18n.t(effectKey) : i18n.t('info_no_effect'));
        
        if (source) {
            tooltipTextSpan.textContent = i18n.t('tooltip_source_prefix') + " " + source;
            scientificSourceDiv.style.display = 'inline-block';
        } else {
            scientificSourceDiv.style.display = 'none';
        }
    }

    // --- 선택된 프리셋 기반 정보 업데이트 ---
    function updateInfoDisplayFromPreset(presetKey) {
        if (!PRESETS_CONFIG || !i18n || !i18n.isInitialized) return;
        const preset = PRESETS_CONFIG[presetKey];
        if (!preset) {
            if(currentSoundInfo) currentSoundInfo.textContent = i18n.t('info_waiting_selection');
            if(soundEffectInfo) soundEffectInfo.textContent = '';
            if(scientificSourceDiv) scientificSourceDiv.style.display = 'none';
            return;
        }
    
        let displayInfoText;
        if (presetKey === "manual") {
            const manualType = manualTypeSelect.value;
            const targetFreq = parseFloat(targetFreqInput.value);
            const baseTone = parseFloat(baseToneInput.value) || DEFAULT_BASE_TONE;
            if (manualType === "binaural") {
                displayInfoText = i18n.t('info_manual_binaural_format', { targetFreq: targetFreq.toFixed(2), baseTone: baseTone.toFixed(2) });
            } else {
                displayInfoText = i18n.t('info_manual_single_tone_format', { targetFreq: targetFreq.toFixed(2) });
            }
        } else {
            displayInfoText = i18n.t(preset.typeKey); // preset.typeKey 자체가 번역 키
        }
        // updateInfoDisplay 함수를 호출하여 일관성 유지
        updateInfoDisplay(displayInfoText, preset.effectKey, preset.source);
    }

    // --- 현재 활성 언어 버튼 스타일 업데이트 ---
    function updateActiveLangButton() {
        if (!langEnButton || !langKoButton || !i18n) return;
        const currentLang = i18n.language.startsWith('ko') ? 'ko' : 'en';
        langEnButton.classList.toggle('active', currentLang === 'en');
        langKoButton.classList.toggle('active', currentLang === 'ko');
    }

    // --- 이벤트 리스너 ---
    if(playPauseButton) playPauseButton.addEventListener('click', () => { /* ... (playSound/stopSound 호출 로직은 위 playSound/stopSound 함수 내부에 있음) ... */ 
        initAudio(); 
        if (isPlaying) stopSound();
        else if (audioCtx && audioCtx.state === 'running') playSound();
        else if(currentSoundInfo) currentSoundInfo.textContent = i18n.t('info_audio_activating');
    });
    if(masterVolumeInput) masterVolumeInput.addEventListener('input', (e) => { if (masterGain) masterGain.gain.value = parseFloat(e.target.value); updateSliderTrack(e.target); });
    if(whiteNoiseToggle) whiteNoiseToggle.addEventListener('change', (e) => {
        whiteNoiseVolumeInput.disabled = !e.target.checked;
        if (audioCtx && audioCtx.state === 'running') {
            if (e.target.checked && isPlaying) playWhiteNoise();
            else stopWhiteNoise();
        }
    });
    if(whiteNoiseVolumeInput) whiteNoiseVolumeInput.addEventListener('input', (e) => { if (whiteNoiseGain) whiteNoiseGain.gain.value = parseFloat(e.target.value); updateSliderTrack(e.target); });
    
    if(goalSelect) goalSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const preset = PRESETS_CONFIG[selectedValue];
        if (!preset) return;

        if (selectedValue === "manual") {
            if(manualSettingsDiv) manualSettingsDiv.style.display = 'block';
            if(manualTypeSelect) manualTypeSelect.value = "binaural"; 
            if(i18n && i18n.isInitialized) updateManualSettingsUI("binaural");
            if(targetFreqInput) targetFreqInput.value = 3; 
            if(baseToneInput) baseToneInput.value = DEFAULT_BASE_TONE; 
        } else {
            if(manualSettingsDiv) manualSettingsDiv.style.display = 'none';
            if (preset.effectHz !== undefined && targetFreqInput && baseToneInput) {
                targetFreqInput.value = preset.effectHz;
                baseToneInput.value = preset.baseTone;
            } else if (preset.singleHz !== undefined && targetFreqInput) {
                targetFreqInput.value = preset.singleHz;
            }
        }

        if (isPlaying) {
            if (audioCtx && audioCtx.state === 'running') playSound(); 
            else if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_setting_changed_play');
        } else {
            updateInfoDisplayFromPreset(selectedValue); 
        }
    });

    if(manualTypeSelect) manualTypeSelect.addEventListener('change', (e) => {
        if(i18n && i18n.isInitialized) updateManualSettingsUI(e.target.value);
        if (!isPlaying && goalSelect.value === "manual") { 
            updateInfoDisplayFromPreset("manual");
        } else if (isPlaying && goalSelect.value === "manual") {
            playSound(); // 수동 재생 중 타입 변경 시 즉시 반영
        }
    });
    
    [targetFreqInput, baseToneInput].forEach(input => {
        if(input) input.addEventListener('input', () => { // 실시간 반영을 위해 'change' 대신 'input'
            if (goalSelect && goalSelect.value === "manual") {
                if (!isPlaying) {
                    updateInfoDisplayFromPreset("manual");
                } else {
                     playSound(); // 수동 재생 중 값 변경 시 즉시 반영
                }
            }
        });
    });

    if(langEnButton) langEnButton.addEventListener('click', () => { if(i18n) i18n.changeLanguage('en'); });
    if(langKoButton) langKoButton.addEventListener('click', () => { if(i18n) i18n.changeLanguage('ko'); });

    // --- 초기화 실행 ---
    initI18next().then(() => {
        // i18next 로드 후 UI 관련 초기화
        if(masterVolumeInput) updateSliderTrack(masterVolumeInput);
        if(whiteNoiseVolumeInput) updateSliderTrack(whiteNoiseVolumeInput);
        if(goalSelect) goalSelect.dispatchEvent(new Event('change')); // 초기 정보 표시 및 UI 업데이트
        console.log("HZMindCare App initialized successfully.");
    }).catch(err => {
        console.error("Critical error during app initialization:", err);
        // i18next 실패 시에도 기본적인 UI는 최대한 표시되도록 시도
        if(masterVolumeInput) updateSliderTrack(masterVolumeInput);
        if(whiteNoiseVolumeInput) updateSliderTrack(whiteNoiseVolumeInput);
        if(goalSelect) {
             buildGoalSelectStructure(); // 구조라도 만들고
             updateGoalSelectTexts(); // 텍스트 업데이트 시도 (i18n 없으면 키가 그대로 보일 수 있음)
             goalSelect.dispatchEvent(new Event('change'));
        }
        if(currentSoundInfo) currentSoundInfo.textContent = "Error initializing app. Please refresh.";
    });
});
