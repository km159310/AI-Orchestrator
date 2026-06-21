// src/utils/state.js
const State = (() => {
  let _state = _initial();

  function _initial() {
    return {
      cur: 0,
      statuses: ['active', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked'],
      agState: {},
      docTab: {},
      projectType: null,
      techStack: null,
      deployEnv: null,
      lob: '',
      bizApp: '',
      project: '',
      // Selected feature suggestion that the pipeline is "adding" to the
      // existing ABC Bank app. Populated by BrdInput.applySuggestion() once
      // /api/inject-feature succeeds; cleared automatically by
      // App.tearDownFeature() when the pipeline reaches the final phase.
      // Shape: { title, icon, prompt, branchSlug, injectedAt } | null
      feature: null,
      pr: {
        branch: 'Application/branch',
        triggering: false,
        queueUrl: null,
        build: null,
        jenkinsUrl: null,
        error: null,
        pollTimer: null,
      },
      approvers: {},
      autoTriggered: {},
      rejections: {},
      log: [],
      lc: 0,
      brd: {
        file: null, fileName: null, fileSize: null,
        pasteText: INIT_PASTE,
        parseStep: 0, parseTimer: null,
        extracted: null,
      },
      bankApp: {
        generated: false,
        generating: false,
        launching: null,
        ports: [],
        files: null,
        path: null,
        lastError: null,
      },
      devRunCount: 0,
      prPipeline: {
        featureStarted: false,
        featureStages: (typeof FEATURE_STAGES !== 'undefined' ? FEATURE_STAGES : []).map(() => 'idle'),
        peerReviewed: false,
        masterStarted: false,
        masterStages: (typeof MASTER_STAGES !== 'undefined' ? MASTER_STAGES : []).map(() => 'idle'),
      },
    };
  }

  function get()  { return _state; }

  function set(patch) {
    _state = Object.assign({}, _state, patch);
  }

  function setBrd(patch) {
    _state.brd = Object.assign({}, _state.brd, patch);
  }

  function setBankApp(patch) {
    _state.bankApp = Object.assign({}, _state.bankApp, patch);
  }

  function setPr(patch) {
    _state.pr = Object.assign({}, _state.pr, patch);
  }

  function setFeature(feature) {
    _state.feature = feature;
  }

  function clearFeature() {
    _state.feature = null;
  }

  function setRejection(pid, patch) {
    const cur = _state.rejections[pid] || { reason: '', verified: false };
    _state.rejections[pid] = Object.assign({}, cur, patch);
  }

  function clearRejection(pid) {
    delete _state.rejections[pid];
  }

  function reset() {
    if (_state.pr && _state.pr.pollTimer) clearInterval(_state.pr.pollTimer);
    if (_state.brd.parseTimer)            clearInterval(_state.brd.parseTimer);
    _state = _initial();
  }

  function initAgents(pid) {
    if (!_state.agState[pid]) {
      _state.agState[pid] = {};
      (AGENTS[pid] || []).forEach(a => {
        _state.agState[pid][a.id] = { status: 'idle', progress: 0, lines: [] };
      });
    }
  }

  function resetAgents(pid) {
    if (_state.agState[pid]) {
      Object.values(_state.agState[pid]).forEach(a => {
        a.status = 'idle'; a.progress = 0; a.lines = [];
      });
    }
  }

  function incrementClock() { _state.lc++; }
  function prependLog(entry) { _state.log.unshift(entry); }

  function incrementDevRunCount() { _state.devRunCount = (_state.devRunCount || 0) + 1; }

  function setPrPipeline(patch) {
    _state.prPipeline = Object.assign({}, _state.prPipeline, patch);
  }

  function setPrFeatureStage(index, status) {
    const cur = (_state.prPipeline.featureStages || []).slice();
    if (index < 0 || index >= cur.length) return;
    cur[index] = status;
    _state.prPipeline = Object.assign({}, _state.prPipeline, { featureStages: cur });
  }

  function setPrMasterStage(index, status) {
    const cur = (_state.prPipeline.masterStages || []).slice();
    if (index < 0 || index >= cur.length) return;
    cur[index] = status;
    _state.prPipeline = Object.assign({}, _state.prPipeline, { masterStages: cur });
  }

  function resetPrPipeline() {
    _state.prPipeline = {
      featureStarted: false,
      featureStages: (typeof FEATURE_STAGES !== 'undefined' ? FEATURE_STAGES : []).map(() => 'idle'),
      peerReviewed: false,
      masterStarted: false,
      masterStages: (typeof MASTER_STAGES !== 'undefined' ? MASTER_STAGES : []).map(() => 'idle'),
    };
  }

  return {
    get, set, setBrd, setBankApp, setPr, setRejection, clearRejection, reset,
    setFeature, clearFeature,
    initAgents, resetAgents, incrementClock, prependLog,
    incrementDevRunCount, setPrPipeline, setPrFeatureStage, setPrMasterStage, resetPrPipeline,
  };
})();
