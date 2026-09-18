import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { readAccountData, writeAccountData } from '../../utils/accountStorage';
import {
  ChevronDown,
  Headphones,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Truck,
  Wrench,
} from 'lucide-react';

const SUPPORT_PHONE = '+919566878623';
const SUPPORT_EMAIL = 'support@threadcraft.com';
const WHATSAPP_NUMBER = '919566878623';

const faqs = [
  { question: 'Where is my order?', answer: 'Open My Orders in the shop header to see your order status, delivery address, and estimated delivery date.' },
  { question: 'What is your return policy?', answer: 'You can request a return within 7 days of delivery for unused items with the original tags attached.' },
  { question: 'How do I choose my size?', answer: 'Our relaxed fit runs true to size. For an oversized look, choose one size up from your usual fit.' },
  { question: 'My payment failed. What should I do?', answer: 'Check your payment details and try again. If the amount was debited, contact us with your order ID so we can investigate.' },
  { question: 'How long does shipping take?', answer: 'Most orders arrive within 3-5 business days after confirmation. Remote locations may take a little longer.' },
];

const issueTypes = ['Wrong size', 'Damaged item', 'Not delivered', 'Other'];
const returnReasons = ['Wrong size', 'Changed my mind', 'Damaged item', 'Wrong item received'];

const ChatPanel = ({ messages, onSend, onClose }) => {
  const [message, setMessage] = useState('');

  const submitMessage = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage('');
  };

  return (
    <div className="rounded-sm border border-line bg-canvas p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div><h3 className="font-bold text-ink-900">ThreadCraft Live Chat</h3><p className="text-xs text-emerald-400">Usually replies in a few seconds</p></div>
        <button type="button" onClick={onClose} className="text-sm text-ink-500 hover:text-ink-900">Close</button>
      </div>
      <div className="my-4 max-h-64 space-y-3 overflow-y-auto">
        {messages.map((item) => (
          <div key={item.id} className={`max-w-[85%] rounded-sm px-3 py-2 text-sm ${item.from === 'user' ? 'ml-auto bg-ink-900 text-canvas' : 'bg-canvasd text-ink-900'}`}>
            {item.text}
          </div>
        ))}
      </div>
      <form onSubmit={submitMessage} className="flex gap-2">
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message" className="min-w-0 flex-1 rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-ink-900" />
        <button type="submit" aria-label="Send chat message" className="rounded-sm bg-ink-900 p-2 text-canvas transition hover:bg-ink-800"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
};

const ContactForm = ({ onSent }) => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitForm = (event) => {
    event.preventDefault();
    if (Object.values(form).some((value) => !value.trim())) return;
    onSent();
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <form onSubmit={submitForm} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input name="name" value={form.name} onChange={updateField} placeholder="Your name" required className="support-input" />
      <input name="email" type="email" value={form.email} onChange={updateField} placeholder="Email address" required className="support-input" />
      <input name="subject" value={form.subject} onChange={updateField} placeholder="Subject" required className="support-input sm:col-span-2" />
      <textarea name="message" value={form.message} onChange={updateField} placeholder="How can we help?" rows="4" required className="support-input sm:col-span-2" />
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-sm font-bold text-canvas transition hover:bg-ink-800 sm:col-span-2"><Send className="h-4 w-4" /> Send message</button>
    </form>
  );
};

const IssueForm = ({ orders, onSubmitted }) => {
  const [form, setForm] = useState({ orderId: orders[0]?.id || '', issueType: issueTypes[0], description: '' });
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitForm = (event) => {
    event.preventDefault();
    if (!form.orderId || !form.description.trim()) return;
    onSubmitted({ ...form, ticketId: `ISS-${Date.now().toString().slice(-6)}` });
    setForm((current) => ({ ...current, description: '' }));
  };

  return (
    <form onSubmit={submitForm} className="mt-4 grid gap-3">
      <select name="orderId" value={form.orderId} onChange={updateField} required className="support-input"><option value="">Select an order</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.id} · {order.product.name}</option>)}</select>
      <select name="issueType" value={form.issueType} onChange={updateField} className="support-input">{issueTypes.map((issue) => <option key={issue}>{issue}</option>)}</select>
      <textarea name="description" value={form.description} onChange={updateField} placeholder="Describe the issue" rows="4" required className="support-input" />
      <button type="submit" disabled={!orders.length} className="rounded-sm bg-ink-900 px-4 py-2.5 text-sm font-bold text-canvas transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-canvasd disabled:text-ink-400">Submit issue</button>
    </form>
  );
};

const ReturnForm = ({ orders, onSubmitted }) => {
  const [form, setForm] = useState({ orderId: orders[0]?.id || '', reason: returnReasons[0] });
  const submitForm = (event) => {
    event.preventDefault();
    if (!form.orderId) return;
    onSubmitted({ ...form, ticketId: `RET-${Date.now().toString().slice(-6)}` });
  };

  return (
    <form onSubmit={submitForm} className="mt-4 grid gap-3">
      <select name="orderId" value={form.orderId} onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))} required className="support-input"><option value="">Select an order</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.id} · {order.product.name}</option>)}</select>
      <select name="reason" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="support-input">{returnReasons.map((reason) => <option key={reason}>{reason}</option>)}</select>
      <button type="submit" disabled={!orders.length} className="rounded-sm bg-ink-900 px-4 py-2.5 text-sm font-bold text-canvas transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-canvasd disabled:text-ink-400">Request return</button>
    </form>
  );
};

const SupportPage = () => {
  const { user } = useAuth();
  const [openPanel, setOpenPanel] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [chatMessages, setChatMessages] = useState([{ id: 1, from: 'agent', text: 'Hi! How can we help with your ThreadCraft order?' }]);
  const [contactSent, setContactSent] = useState(false);
  const [tickets, setTickets] = useState(() => readAccountData(user).tickets);
  const [supportOrders, setSupportOrders] = useState(() => readAccountData(user).orders);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    const accountData = readAccountData(user);
    setTickets(accountData.tickets);
    setSupportOrders(accountData.orders);
  }, [user]);

  const sendChat = (text) => {
    setChatMessages((current) => [...current, { id: Date.now(), from: 'user', text }]);
    window.setTimeout(() => setChatMessages((current) => [...current, { id: Date.now() + 1, from: 'agent', text: 'Thanks for reaching out. A support specialist is reviewing that now.' }]), 900);
  };

  const addTicket = (ticket, label) => {
    setTickets((current) => [ticket, ...current]);
    const data = readAccountData(user);
    writeAccountData(user, { ...data, tickets: [ticket, ...data.tickets] });
    setConfirmation(`${label} submitted. Reference ${ticket.ticketId}.`);
  };

  return (
    <section className="min-h-screen bg-white px-4 py-8 text-ink-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-500">ThreadCraft care</p><h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">How can we help?</h1><p className="mt-3 max-w-xl text-ink-500">Get quick answers, reach a real person, or send us the details of an order issue.</p></div>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-sm border border-emerald-500/50 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/10"><MessageCircle className="h-4 w-4" /> WhatsApp support</a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <button type="button" onClick={() => setOpenPanel(openPanel === 'chat' ? null : 'chat')} aria-expanded={openPanel === 'chat'} aria-controls="support-chat" className="support-card cursor-pointer text-left"><MessageCircle className="h-6 w-6 text-ink-700" /><h2 className="mt-4 font-bold text-ink-900">Live Chat</h2><p className="mt-1 text-sm text-ink-500">Message our support team.</p></button>
          <a href={`tel:${SUPPORT_PHONE}`} aria-label={`Call support at ${SUPPORT_PHONE}`} className="support-card"><Phone className="h-6 w-6 text-emerald-300" /><h2 className="mt-4 font-bold text-ink-900">Call Us</h2><p className="mt-1 text-sm text-ink-500">Call support at {SUPPORT_PHONE}</p></a>
          <button type="button" onClick={() => { setOpenPanel(openPanel === 'email' ? null : 'email'); setContactSent(false); }} aria-expanded={openPanel === 'email'} aria-controls="support-email" className="support-card cursor-pointer text-left"><Mail className="h-6 w-6 text-sky-300" /><h2 className="mt-4 font-bold text-ink-900">Email Us</h2><p className="mt-1 text-sm text-ink-500">{SUPPORT_EMAIL}</p></button>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            {openPanel === 'chat' && <div id="support-chat"><ChatPanel messages={chatMessages} onSend={sendChat} onClose={() => setOpenPanel(null)} /></div>}
            {openPanel === 'email' && <div id="support-email" className="support-section"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Contact support</h2><p className="text-sm text-ink-500">Or email us directly at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink-700 hover:underline">{SUPPORT_EMAIL}</a></p></div><Mail className="h-5 w-5 text-sky-300" /></div>{contactSent && <p className="mt-4 rounded-sm bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Message sent. We will get back to you shortly.</p>}<ContactForm onSent={() => setContactSent(true)} /></div>}

            <div className="support-section"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-ink-700" /><h2 className="font-bold text-ink-900">FAQ / Help Center</h2></div><div className="mt-4 divide-y divide-line">{faqs.map((faq, index) => <div key={faq.question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} className="flex w-full cursor-pointer items-center justify-between py-3 text-left text-sm font-semibold text-ink-900"><span>{faq.question}</span><ChevronDown className={`h-4 w-4 transition ${openFaq === index ? 'rotate-180 text-ink-700' : 'text-ink-400'}`} /></button>{openFaq === index && <p id={`faq-answer-${index}`} className="pb-4 text-sm leading-6 text-ink-500">{faq.answer}</p>}</div>)}</div></div>
          </div>

          <div className="space-y-4">
            <div className="support-section"><button type="button" onClick={() => setOpenPanel(openPanel === 'issue' ? null : 'issue')} aria-expanded={openPanel === 'issue'} aria-controls="support-issue" className="flex w-full cursor-pointer items-start gap-3 text-left"><Wrench className="h-5 w-5 text-amber-300" /><span><h2 className="font-bold text-ink-900">Order Issues</h2><p className="mt-1 text-sm text-ink-500">Report a problem with a delivered or missing order.</p></span><ChevronDown className={`ml-auto h-4 w-4 text-ink-400 transition ${openPanel === 'issue' ? 'rotate-180' : ''}`} /></button>{openPanel === 'issue' && <div id="support-issue"><IssueForm orders={supportOrders} onSubmitted={(ticket) => addTicket(ticket, 'Issue report')} /></div>}</div>
            <div className="support-section"><button type="button" onClick={() => setOpenPanel(openPanel === 'return' ? null : 'return')} aria-expanded={openPanel === 'return'} aria-controls="support-return" className="flex w-full cursor-pointer items-start gap-3 text-left"><Package className="h-5 w-5 text-ink-700" /><span><h2 className="font-bold text-ink-900">Returns & Refunds</h2><p className="mt-1 text-sm text-ink-500">Request a return and see the next steps.</p></span><ChevronDown className={`ml-auto h-4 w-4 text-ink-400 transition ${openPanel === 'return' ? 'rotate-180' : ''}`} /></button>{openPanel === 'return' && <div id="support-return"><ReturnForm orders={supportOrders} onSubmitted={(ticket) => addTicket(ticket, 'Return request')} /></div>}</div>
            <div className="support-section"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink-900">My Tickets</h2><p className="mt-1 text-sm text-ink-500">Your support requests from this session.</p></div><Star className="h-5 w-5 text-amber-300" /></div>{tickets.length === 0 ? <p className="mt-4 text-sm text-ink-400">No tickets submitted yet.</p> : <div className="mt-4 space-y-2">{tickets.map((ticket) => <div key={ticket.ticketId} className="rounded-sm bg-canvas px-3 py-2 text-sm"><span className="font-bold text-ink-700">{ticket.ticketId}</span><span className="ml-2 text-ink-500">{ticket.issueType || ticket.reason}</span></div>)}</div>}{confirmation && <p className="mt-4 rounded-sm bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{confirmation}</p>}</div>
            <a href={`tel:${SUPPORT_PHONE}`} className="support-section flex items-center gap-3 transition hover:border-emerald-400"><Truck className="h-5 w-5 text-emerald-300" /><span><h2 className="font-bold text-ink-900">Need delivery help?</h2><p className="mt-1 text-sm text-ink-500">Call our support line now.</p></span><Phone className="ml-auto h-4 w-4 text-ink-400" /></a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-ink-400"><Link to="/shop" className="font-semibold text-ink-700 hover:underline">Back to shop</Link></div>
      </div>
    </section>
  );
};

export default SupportPage;
