'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { BookOpen, Flame, Zap, LogIn, LogOut, Sparkles, Volume2, Image as ImageIcon, Video, Trophy, Link2, Download, Mic, Users, RotateCcw, ScrollText, Compass } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getFirebaseClient } from '@/lib/firebase-client';
import type { UserProfile } from '@/lib/types';
import { useTutorStore } from '@/lib/store';
import Mascot3D from '@/components/Mascot3D';
import Podium3D from '@/components/Podium3D';

type Question = { question: string; choices: string[] };
type Review = { id: string; question: string };
type Leader = { rank: number; name: string; level: string; xp: number; streak: number };

export default function Dashboard() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [openResponse, setOpenResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [answer, setAnswer] = useState('');
  const [featureReply, setFeatureReply] = useState('');
  const [dictation, setDictation] = useState<{ id: string; sentence: string } | null>(null);
  const [dictationText, setDictationText] = useState('');
  const [dictationResult, setDictationResult] = useState<{ accuracy: number; target: string; detail: Array<{ word: string; correct: boolean }>; feedback: string } | null>(null);
  const [link, setLink] = useState<{ code: string; url: string; expiresAt: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewInput, setReviewInput] = useState<Record<string, string>>({});
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [modeInput, setModeInput] = useState('at an airport');
  const [mediaTarget, setMediaTarget] = useState('');
  const [matchState, setMatchState] = useState('');
  const [activeMatchId, setActiveMatchId] = useState('');
  const [matchMessage, setMatchMessage] = useState('');
  const [matchMessages, setMatchMessages] = useState<Array<{ uid: string; text: string; feedback: string }>>([]);
  const [activeMode, setActiveMode] = useState<'roleplay' | 'story'>('roleplay');
  const [levelQuestions, setLevelQuestions] = useState<Question[]>([]);
  const [levelAnswers, setLevelAnswers] = useState<string[]>([]);
  const [levelWriting, setLevelWriting] = useState('');
  const setMood = useTutorStore(s => s.setMood);

  useEffect(() => {
    try { return onAuthStateChanged(getFirebaseClient().auth, setAuthUser); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Firebase configuration is missing.'); }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    try {
      return onSnapshot(doc(getFirebaseClient().db, 'users', authUser.uid), s => setProfile(s.exists() ? s.data() as UserProfile : null), e => setNotice(`Live sync paused: ${e.message}`));
    } catch (e) { setNotice(String(e)); }
  }, [authUser]);

  useEffect(() => {
    if (!authUser || profile?.cefrLevel) return;
    let active = true;
    (async () => {
      try {
        const t = await authUser.getIdToken(), r = await fetch('/api/placement', { headers: { authorization: `Bearer ${t}` } }), d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active && !d.complete) { setQuestions(d.questions); setAnswers(Array(d.answered || 0).fill('')); }
        else if (active && d.complete) setNotice(`Your current level is ${d.level}.`);
      } catch (e) { if (active) setNotice(e instanceof Error ? e.message : 'Placement could not load.'); }
    })();
    return () => { active = false; };
  }, [authUser, profile?.cefrLevel]);

  const post = useCallback(async (action: string, fields: Record<string, unknown> = {}) => {
    if (!authUser) throw Error('Sign in first.');
    const token = await authUser.getIdToken();
    const r = await fetch('/api/features', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ action, ...fields }) });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || 'Activity failed');
    return d;
  }, [authUser]);

  async function signIn() {
    setBusy(true);
    try { await signInWithPopup(getFirebaseClient().auth, new GoogleAuthProvider()); setNotice(''); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  }

  async function submitPlacement() {
    if (answers.length !== 5 || answers.some(x => !x) || openResponse.trim().length < 8) { setNotice('Answer all five questions and write at least a short English sentence.'); return; }
    setBusy(true);
    try {
      const t = await authUser!.getIdToken(), r = await fetch('/api/placement', { method: 'POST', headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' }, body: JSON.stringify({ answers, openResponse, displayName: authUser?.displayName || undefined }) }), d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMood('happy'); setNotice(`Placement complete — objective ${d.score}/5, writing ${d.openLevel}. You are ${d.level}.`); setQuestions([]);
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Placement failed.'); setMood('encouraging'); }
    finally { setBusy(false); }
  }

  async function askTutor(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setBusy(true); setMood('speaking');
    try {
      const token = await authUser!.getIdToken(), r = await fetch('/api/learn', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ message: answer }) }), d = await r.json();
      if (!r.ok) throw Error(d.error);
      setFeatureReply(d.reply); setAnswer(''); setMood('happy');
    } catch (e) { setFeatureReply(e instanceof Error ? e.message : 'Tutor unavailable.'); setMood('encouraging'); }
    finally { setBusy(false); }
  }

  async function getLink() {
    setBusy(true);
    try {
      const t = await authUser!.getIdToken(), r = await fetch('/api/link', { method: 'POST', headers: { authorization: `Bearer ${t}` } }), d = await r.json();
      if (!r.ok) throw Error(d.error);
      setLink(d);
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Unable to link Telegram.'); }
    finally { setBusy(false); }
  }

  async function beginDictation() {
    setBusy(true);
    try {
      const d = await post('dictation_start');
      setDictation(d); setDictationText(''); setDictationResult(null); setFeatureReply('Listen, then type exactly what you hear.'); setMood('speaking');
      if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(d.sentence); u.lang = 'en-US'; u.rate = 1; window.speechSynthesis.speak(u); }
    } catch (e) { setNotice(String(e)); }
    finally { setBusy(false); }
  }

  async function checkDictation() {
    if (!dictation) return;
    setBusy(true);
    try {
      const d = await post('dictation_check', { sessionId: dictation.id, text: dictationText });
      setFeatureReply(`${d.feedback} Accuracy: ${d.accuracy}%. Expected: “${d.target}”`); setDictationResult(d); setDictation(null); setMood(d.accuracy >= 80 ? 'happy' : 'encouraging');
    } catch (e) { setNotice(String(e)); }
    finally { setBusy(false); }
  }

  async function uploadMedia(kind: 'image' | 'pronunciation' | 'shadowing', file?: File) {
    if (!file) return;
    setBusy(true); setMood('speaking');
    try {
      const t = await authUser!.getIdToken(), form = new FormData();
      form.set('file', file); form.set('kind', kind); form.set('target', mediaTarget);
      const r = await fetch('/api/media', { method: 'POST', headers: { authorization: `Bearer ${t}` }, body: form }), d = await r.json();
      if (!r.ok) throw Error(d.error);
      setFeatureReply(`${d.score === null ? '' : `Approx. score ${d.score}/100\n`}${d.reply}`); setMood(d.score !== null && d.score < 70 ? 'encouraging' : 'happy');
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Media analysis failed.'); setMood('encouraging'); }
    finally { setBusy(false); }
  }

  async function runFeature(action: string, fields: Record<string, unknown> = {}) {
    setBusy(true); setMood('speaking');
    try {
      const d = await post(action, fields);
      if (action === 'leaderboard') setLeaders(d.leaders);
      else if (action === 'review_list') setReviews(d.reviews);
      else if (action === 'match') { setMatchState(d.matched ? `Matched! Partner: ${d.partner || 'same-level learner'} · ${d.matchId}` : d.message); if (d.matched && d.matchId) setActiveMatchId(d.matchId); }
      else if (action === 'match_status') { setMatchState(d.matched ? `Matched with a ${d.level} learner · ${d.matchId}` : d.message); if (d.matched && d.matchId) setActiveMatchId(d.matchId); }
      else if (action === 'certificate') downloadCertificate(d);
      else {
        if (action === 'roleplay_start') setActiveMode('roleplay');
        if (action === 'story_start') setActiveMode('story');
        setFeatureReply(d.reply || d.feedback || JSON.stringify(d)); setMood(d.correct === false ? 'encouraging' : 'happy');
      }
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not complete activity.'); setMood('encouraging'); }
    finally { setBusy(false); }
  }

  async function answerReview(item: Review) {
    const text = reviewInput[item.id] || '';
    if (!text.trim()) return;
    setBusy(true);
    try {
      const d = await post('review_answer', { reviewId: item.id, text });
      setFeatureReply(d.feedback); setReviews(prev => prev.filter(r => r.id !== item.id)); setMood(d.correct ? 'happy' : 'encouraging');
    } catch (e) { setNotice(String(e)); }
    finally { setBusy(false); }
  }

  async function loadPeerMessages() {
    if (!activeMatchId) return;
    try { const d = await post('match_messages', { matchId: activeMatchId }); setMatchMessages(d.messages); }
    catch (e) { setNotice(String(e)); }
  }

  async function sendPeerMessage(e: FormEvent) {
    e.preventDefault();
    if (!activeMatchId || !matchMessage.trim()) return;
    setBusy(true);
    try {
      const d = await post('match_message', { matchId: activeMatchId, text: matchMessage });
      setMatchMessage(''); setFeatureReply(d.feedback); await loadPeerMessages(); setMood('happy');
    } catch (e) { setNotice(String(e)); }
    finally { setBusy(false); }
  }

  async function startLevelTest() {
    setBusy(true);
    try {
      const d = await post('level_test_start');
      setLevelQuestions(d.questions); setLevelAnswers(Array(5).fill('')); setLevelWriting('');
      setFeatureReply(`Level assessment: ${d.target}. You need 4/5 grammar answers and matching writing proficiency.`);
    } catch (e) { setNotice(String(e)); }
    finally { setBusy(false); }
  }

  async function submitLevelTest() {
    setBusy(true);
    try {
      const d = await post('level_test_submit', { answers: levelAnswers, openResponse: levelWriting });
      setFeatureReply(d.message); setLevelQuestions([]); setMood(d.leveledUp ? 'happy' : 'encouraging');
      if (d.leveledUp) { const cert = await post('certificate'); downloadCertificate(cert); }
    } catch (e) { setNotice(String(e)); }
    finally { setBusy(false); }
  }

  function downloadCertificate(d: { name: string; level: string; issuedAt: string; xp: number }) {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1600; const x = c.getContext('2d'); if (!x) return;
    const g = x.createLinearGradient(0, 0, 2400, 1600); g.addColorStop(0, '#120e20'); g.addColorStop(1, '#31214f');
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); x.strokeStyle = '#d7bc72'; x.lineWidth = 16; x.strokeRect(70, 70, 2260, 1460);
    x.strokeStyle = '#bba4ff'; x.lineWidth = 3; x.strokeRect(105, 105, 2190, 1390); x.textAlign = 'center'; x.fillStyle = '#d9c9ff';
    x.font = '600 50px Arial'; x.fillText('ALAN TUTOR • ENGLISH MILESTONE', 1200, 320); x.fillStyle = '#fff'; x.font = '700 112px Georgia';
    x.fillText('Certificate of Achievement', 1200, 520); x.fillStyle = '#c6b7de'; x.font = '44px Arial'; x.fillText('This certifies that', 1200, 670);
    x.fillStyle = '#f4d985'; x.font = '700 76px Georgia'; x.fillText(d.name, 1200, 790); x.fillStyle = '#e5def2'; x.font = '42px Arial';
    x.fillText('has demonstrated English proficiency at level', 1200, 900); x.fillStyle = '#c0a4ff'; x.font = '700 150px Arial'; x.fillText(d.level, 1200, 1080);
    x.fillStyle = '#eee'; x.font = '32px Arial'; x.fillText(`Issued ${d.issuedAt}  •  ${d.xp} XP earned`, 1200, 1215); x.beginPath();
    x.arc(1200, 1360, 82, 0, Math.PI * 2); x.fillStyle = '#a58bff'; x.fill(); x.beginPath(); x.ellipse(1200, 1422, 43, 25, 0, Math.PI, 0);
    x.fillStyle = '#367a71'; x.fill(); x.beginPath(); x.ellipse(1200, 1355, 43, 51, 0, 0, Math.PI * 2); x.fillStyle = '#d89f83'; x.fill();
    x.beginPath(); x.ellipse(1200, 1335, 45, 33, 0, Math.PI, Math.PI * 2); x.fillStyle = '#26212f'; x.fill(); x.fillStyle = '#fff'; x.beginPath();
    x.arc(1184, 1353, 6, 0, Math.PI * 2); x.arc(1216, 1353, 6, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#443950'; x.lineWidth = 4; x.beginPath();
    x.arc(1184, 1353, 11, 0, Math.PI * 2); x.arc(1216, 1353, 11, 0, Math.PI * 2); x.moveTo(1195, 1353); x.lineTo(1205, 1353); x.stroke();
    x.beginPath(); x.arc(1200, 1375, 12, 0, Math.PI); x.strokeStyle = '#8f355c'; x.lineWidth = 4; x.stroke(); x.fillStyle = '#d9c9ff';
    x.font = '25px Arial'; x.fillText('ALAN • YOUR ENGLISH TUTOR', 1200, 1480);
    const a = document.createElement('a'); a.download = `alan-tutor-${d.level}-certificate.png`; a.href = c.toDataURL('image/png'); a.click();
  }

  async function submitMode(action: string) {
    await runFeature(action, { mood: modeInput, text: answer });
    if (action.endsWith('_turn') || action.endsWith('_choose')) setAnswer('');
  }

  const stats = [
    { label: 'Current level', value: profile?.cefrLevel ?? '—', icon: BookOpen },
    { label: 'Experience', value: `${profile?.xpPoints ?? 0} XP`, icon: Zap },
    { label: 'Day streak', value: `${profile?.streakCount ?? 0} days`, icon: Flame }
  ];

  return (
    <section className="dashboard-wrap" id="dashboard">
      {!authUser ? (
        <div className="signin glass">
          <div className="eyebrow"><Sparkles size={15} /> YOUR PERSONAL ENGLISH COACH</div>
          <h2>One small lesson.<br /><span>Big new worlds.</span></h2>
          <p>Sign in to save your progress and continue learning across Alan Tutor.</p>
          <button className="primary-btn" onClick={signIn} disabled={busy}>
            <LogIn size={18} />{busy ? 'Connecting…' : 'Continue with Google'}
          </button>
          <small>Firebase Authentication secures your learning profile.</small>
        </div>
      ) : (
        <>
          <div className="welcome-row">
            <div>
              <div className="eyebrow">YOUR LEARNING SPACE</div>
              <h2>Good to see you, <span>{authUser.displayName?.split(' ')[0] || 'learner'}.</span></h2>
            </div>
            <button className="icon-button" aria-label="Sign out" onClick={() => signOut(getFirebaseClient().auth)}>
              <LogOut size={17} />
            </button>
          </div>
          <div className="stat-grid">
            {stats.map((s, i) => (
              <motion.div className="stat-card glass" key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .08 }}>
                <div className="stat-icon"><s.icon size={17} /></div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </motion.div>
            ))}
          </div>
          
          {!profile?.cefrLevel && (
            <div className="placement glass">
              <div className="placement-avatar">
                <Mascot3D compact />
                <div>
                  <div className="eyebrow">PLACEMENT · GRAMMAR + WRITING</div>
                  <h3>Let’s find your starting point</h3>
                </div>
              </div>
              {questions.length === 0 ? <p>Loading your placement check…</p> : (
                <>
                  <p>Five scored grammar questions, then a short writing sample.</p>
                  {questions.map((q, qi) => (
                    <fieldset className="question" key={qi}>
                      <legend>{qi + 1}. {q.question}</legend>
                      <div className="choice-grid">
                        {q.choices.map((choice, ci) => (
                          <button type="button" key={ci} className={`choice ${answers[qi] === String.fromCharCode(65 + ci) ? 'selected' : ''}`} onClick={() => setAnswers(prev => { const n = [...prev]; n[qi] = String.fromCharCode(65 + ci); return n; })}>
                            {String.fromCharCode(65 + ci)} <span>{choice}</span>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <label className="feature-label">Write a few English sentences about yourself
                    <textarea className="feature-input" value={openResponse} onChange={e => setOpenResponse(e.target.value)} maxLength={1200} placeholder="My name is… I enjoy learning English because…" />
                  </label>
                  <button className="primary-btn" disabled={busy} onClick={submitPlacement}>
                    {busy ? 'Assessing…' : 'Reveal my level'} <Sparkles size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {profile?.cefrLevel && (
            <>
              <div className="practice glass">
                <div className="practice-head">
                  <div>
                    <div className="eyebrow">TUTOR CHAT · {profile.cefrLevel}</div>
                    <h3>Ask Alan anything</h3>
                  </div>
                  <div className="mini-level">{profile.cefrLevel}</div>
                </div>
                <p>Get grammar explanations in Sorani Kurdish, with examples matched to your level.</p>
                <form onSubmit={askTutor} className="ask-form">
                  <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Try: When do I use ‘since’ and ‘for’ ?" aria-label="Ask your English tutor" />
                  <button className="primary-btn" disabled={busy}>{busy ? 'Thinking…' : 'Ask Alan'}</button>
                </form>
                {featureReply && (
                  <div className="reply-row">
                    <div className="reply-avatar"><Mascot3D compact /></div>
                    <div className="tutor-reply" role="status" dir="auto">
                      <div className="markdown-content">
                        <ReactMarkdown>{featureReply}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="feature-grid">
                <article className="feature-card glass feature-interactive">
                  <span className="feature-symbol"><Volume2 /></span>
                  <div>
                    <b>Dictation practice</b>
                    <p>Native-speed audio, transcript hidden until you answer.</p>
                    <button className="text-action" disabled={busy} onClick={beginDictation}>{dictation ? 'Replay audio' : 'Start dictation'}</button>
                    {dictation && (
                      <>
                        <button className="text-action" onClick={() => { const u = new SpeechSynthesisUtterance(dictation.sentence); u.lang = 'en-US'; u.rate = 1; window.speechSynthesis.speak(u); }}>▶ Play at natural speed</button>
                        <input className="feature-input" value={dictationText} onChange={e => setDictationText(e.target.value)} placeholder="Type what you heard" />
                        <button className="text-action" onClick={checkDictation}>Check transcription</button>
                      </>
                    )}
                    {dictationResult && (
                      <div className="word-accuracy">
                        <b>{dictationResult.accuracy}% word accuracy</b>
                        <div>{dictationResult.detail.map((w, i) => <span className={w.correct ? 'word-correct' : 'word-missed'} key={`${w.word}-${i}`}>{w.word} </span>)}</div>
                      </div>
                    )}
                  </div>
                </article>
                <article className="feature-card glass feature-interactive">
                  <span className="feature-symbol"><ImageIcon /></span>
                  <div>
                    <b>Explain a photo</b>
                    <p>Extract text and explain grammar in Sorani.</p>
                    <label className="text-action upload-label">Choose image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => uploadMedia('image', e.target.files?.[0])} /></label>
                  </div>
                </article>
                <article className="feature-card glass feature-interactive">
                  <span className="feature-symbol"><Mic /></span>
                  <div>
                    <b>Pronunciation coach</b>
                    <p>Upload a short recording for approximate feedback.</p>
                    <input className="feature-input" value={mediaTarget} onChange={e => setMediaTarget(e.target.value)} placeholder="Target: I would like a coffee" />
                    <label className="text-action upload-label">Choose audio<input type="file" accept="audio/*" onChange={e => uploadMedia('pronunciation', e.target.files?.[0])} /></label>
                  </div>
                </article>
                <article className="feature-card glass feature-interactive">
                  <span className="feature-symbol"><Video /></span>
                  <div>
                    <b>Video shadowing</b>
                    <p>Get speech transcript, idiom notes and a repeat prompt.</p>
                    <label className="text-action upload-label">Choose short clip<input type="file" accept="video/mp4,video/webm" onChange={e => uploadMedia('shadowing', e.target.files?.[0])} /></label>
                  </div>
                </article>
              </div>

              <div className="activity-grid">
                <section className="activity-card glass">
                  <div className="eyebrow"><RotateCcw size={14} /> SPACED REVIEW</div>
                  <h3>Keep tricky phrases fresh</h3>
                  <button className="secondary-btn" onClick={() => runFeature('review_list')}>Load due review cards</button>
                  {reviews.map(r => (
                    <div className="review-card" key={r.id}>
                      <p>{r.question}</p>
                      <input className="feature-input" value={reviewInput[r.id] || ''} onChange={e => setReviewInput({ ...reviewInput, [r.id]: e.target.value })} placeholder="Your answer" />
                      <button className="text-action" onClick={() => answerReview(r)}>Check answer</button>
                    </div>
                  ))}
                </section>
                <section className="activity-card glass">
                  <div className="eyebrow"><Compass size={14} /> IMMERSION</div>
                  <h3>Learn through real situations</h3>
                  <input className="feature-input" value={modeInput} onChange={e => setModeInput(e.target.value)} placeholder="Mood or setting: airport, excited…" />
                  <div className="button-row">
                    <button className="secondary-btn" onClick={() => submitMode('scenario')}>5 situational idioms</button>
                    <button className="secondary-btn" onClick={() => submitMode('roleplay_start')}>Start role-play</button>
                    <button className="secondary-btn" onClick={() => submitMode('story_start')}>Start adventure</button>
                  </div>
                  <form className="ask-form" onSubmit={e => { e.preventDefault(); submitMode(activeMode === 'story' ? 'story_choose' : 'roleplay_turn') }}>
                    <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Your role-play/story response" />
                    <button className="primary-btn">Respond</button>
                  </form>
                </section>
                <section className="activity-card glass">
                  <div className="eyebrow"><Users size={14} /> SOCIAL LEARNING</div>
                  <h3>Practice with a peer</h3>
                  <p>Find a learner at your CEFR level. Matching is private and opt-in.</p>
                  <div className="button-row">
                    <button className="secondary-btn" onClick={() => runFeature('match')}>Find a partner</button>
                    <button className="secondary-btn" onClick={() => runFeature('match_status')}>Check match</button>
                  </div>
                  {matchState && <p className="feature-result">{matchState}</p>}
                  {activeMatchId && (
                    <>
                      <form className="ask-form" onSubmit={sendPeerMessage}>
                        <input value={matchMessage} onChange={e => setMatchMessage(e.target.value)} placeholder="Say hello to your practice partner" />
                        <button className="primary-btn" disabled={busy}>Send</button>
                      </form>
                      <button className="text-action" onClick={loadPeerMessages}>Load conversation</button>
                      <div className="peer-thread">
                        {matchMessages.map((m, i) => (
                          <div className="peer-message" key={`${m.uid}-${i}`}>
                            <b>{m.uid === authUser.uid ? 'You' : 'Partner'}</b>
                            <p>{m.text}</p>
                            <small>{m.feedback}</small>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
                <section className="activity-card glass">
                  <div className="eyebrow"><Sparkles size={14} /> CEFR PROGRESSION</div>
                  <h3>Take your next-level check</h3>
                  <p>Earn your next CEFR tier through a scored grammar and writing challenge. Pass to unlock a certificate.</p>
                  <button className="secondary-btn" disabled={busy || profile.cefrLevel === 'C2'} onClick={startLevelTest}>Start level assessment</button>
                  {levelQuestions.length > 0 && (
                    <div className="level-test">
                      {levelQuestions.map((q, qi) => (
                        <fieldset className="question" key={qi}>
                          <legend>{qi + 1}. {q.question}</legend>
                          <div className="choice-grid">
                            {q.choices.map((choice, ci) => (
                              <button type="button" key={ci} className={`choice ${levelAnswers[qi] === String.fromCharCode(65 + ci) ? 'selected' : ''}`} onClick={() => setLevelAnswers(prev => { const n = [...prev]; n[qi] = String.fromCharCode(65 + ci); return n; })}>
                                {String.fromCharCode(65 + ci)} <span>{choice}</span>
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                      <textarea className="feature-input" value={levelWriting} onChange={e => setLevelWriting(e.target.value)} placeholder="Write a short response in English to demonstrate your current level." />
                      <button className="text-action" disabled={busy || levelAnswers.some(a => !a) || levelWriting.trim().length < 12} onClick={submitLevelTest}>Submit level test</button>
                    </div>
                  )}
                </section>
                <section className="activity-card glass podium">
                  <div className="eyebrow"><Trophy size={14} /> XP LEADERBOARD</div>
                  <h3>Community champions</h3>
                  <button className="secondary-btn" onClick={() => runFeature('leaderboard')}>Refresh leaderboard</button>
                  <Podium3D />
                  <div className="podium-list">
                    {leaders.map((l, i) => (
                      <div className={`leader-row rank-${i + 1}`} key={`${l.rank}-${l.name}`}>
                        <b className="rank-badge">{l.rank}</b>
                        <span>{l.name}<small>{l.level} · 🔥 {l.streak}</small></span>
                        <strong>{l.xp} XP</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="account-tools glass">
                <div>
                  <div className="eyebrow"><Link2 size={14} /> CROSS-PLATFORM SYNC</div>
                  <h3>Link your Telegram account</h3>
                  <p>Generate a one-time code, open Telegram, and send /start link_CODE to the bot.</p>
                  {link && (
                    <div className="link-code">
                      <strong>{link.code}</strong>
                      <a className="secondary-btn" href={link.url} target="_blank" rel="noreferrer">Open Telegram ↗</a>
                      <small>Expires {new Date(link.expiresAt).toLocaleTimeString()}</small>
                    </div>
                  )}
                </div>
                <button className="secondary-btn" disabled={busy} onClick={getLink}>{link ? 'Generate a new code' : 'Create 10-minute link code'}</button>
              </div>
              <div className="certificate-row glass">
                <div>
                  <div className="eyebrow"><ScrollText size={14} /> MILESTONE</div>
                  <b>Celebrate your current level</b>
                  <p>Download a high-resolution PNG certificate for {profile.cefrLevel}.</p>
                </div>
                <button className="primary-btn" onClick={() => runFeature('certificate')}><Download size={16} />Download certificate</button>
              </div>
            </>
          )}
        </>
      )}
      {notice && <p className="notice" role="status">{notice}</p>}
    </section>
  );
}