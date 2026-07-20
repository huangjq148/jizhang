"use client";

import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, DatePicker, Empty, Input, SpinLoading, Toast, unstableSetRender } from "antd-mobile";
import { currentMonthRange } from "../lib/finance.mjs";

unstableSetRender((node, container) => {
  const root = createRoot(container);
  root.render(node);
  return () => root.unmount();
});

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function DateField({ label, value, onChange, title }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <DatePicker
        value={parseLocalDate(value)}
        title={title}
        onConfirm={(date) => onChange(formatLocalDate(date))}
      >
        {(_, actions) => (
          <button className="date-input date-picker-trigger" type="button" onClick={actions.open}>
            {value}
          </button>
        )}
      </DatePicker>
    </label>
  );
}

function EntryModal({ entry, onClose, onSaved }) {
  const [date, setDate] = useState(entry?.date || formatLocalDate(new Date()));
  const [income, setIncome] = useState(entry?.income || "0.00");
  const [expense, setExpense] = useState(entry?.expense || "0.00");
  const [loading, setLoading] = useState(false);

  async function save(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        entry ? `/api/entries/${entry.id}` : "/api/entries",
        {
          method: entry ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, income, expense }),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "保存失败");
      Toast.show({ content: entry ? "账目已更新" : "账目已新增" });
      onSaved();
    } catch (error) {
      Toast.show({ content: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="entry-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
      >
        <div className="modal-header">
          <h2 id="entry-modal-title">{entry ? "编辑账目" : "新增账目"}</h2>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <form className="entry-form" onSubmit={save}>
          <DateField label="日期" value={date} onChange={setDate} title="选择日期" />
          <label>
            <span className="field-label">收入</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={income}
              onChange={setIncome}
              placeholder="请输入收入"
              clearable
            />
          </label>
          <label>
            <span className="field-label">支出</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={expense}
              onChange={setExpense}
              placeholder="请输入支出"
              clearable
            />
          </label>
          <div className="modal-actions">
            <Button onClick={onClose}>取消</Button>
            <Button color="primary" type="submit" loading={loading}>
              保存
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function HomeClient({ username }) {
  const initialRange = useMemo(() => currentMonthRange(), []);
  const [range, setRange] = useState(initialRange);
  const [data, setData] = useState({ balance: "0.00", totalIncome: "0.00", totalExpense: "0.00", entries: [] });
  const [loading, setLoading] = useState(true);
  const [modalEntry, setModalEntry] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(undefined);

  async function loadEntries() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/entries?startDate=${range.startDate}&endDate=${range.endDate}`,
        { cache: "no-store" },
      );
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "查询失败");
      setData(body);
    } catch (error) {
      Toast.show({ content: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, [range.startDate, range.endDate]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function saveCompleted() {
    setModalOpen(false);
    setModalEntry(undefined);
    loadEntries();
  }

  async function deleteEntry(entry) {
    if (!window.confirm(`确定删除 ${entry.date} 的账目吗？`))
      return;
    setDeletingId(entry.id);
    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "删除失败");
      Toast.show({ content: "账目已删除" });
      await loadEntries();
    } catch (error) {
      Toast.show({ content: error.message });
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <main className="page-shell">
      <div className="content-wrap">
        <header className="topbar">
          <div className="brand-mark">
            <div className="brand-icon">¥</div>
            <h1>小账本</h1>
          </div>
          <div className="user-actions">
            <span>{username}</span>
            <button className="logout-button" type="button" onClick={logout}>
              退出
            </button>
          </div>
        </header>
        <section className="summary-card">
          <div className="eyebrow">筛选范围内结余</div>
          <div className="summary-amount">¥ {data.balance}</div>
          <div className="summary-breakdown">
            <div>
              <span>总收入</span>
              <strong>¥ {data.totalIncome}</strong>
            </div>
            <div>
              <span>总支出</span>
              <strong>¥ {data.totalExpense}</strong>
            </div>
          </div>
        </section>
        <section className="section-card">
          <div className="date-range">
            <DateField
              value={range.startDate}
              onChange={(startDate) => setRange((current) => ({ ...current, startDate }))}
              title="选择开始日期"
            />
            <span className="date-range-separator">—</span>
            <DateField
              value={range.endDate}
              onChange={(endDate) => setRange((current) => ({ ...current, endDate }))}
              title="选择结束日期"
            />
          </div>
        </section>
        <section className="section-card">
          <div className="section-heading">
            <h2>账目明细</h2>
            <Button
              color="primary"
              size="small"
              onClick={() => {
                setModalEntry(undefined);
                setModalOpen(true);
              }}
            >
              ＋ 新增
            </Button>
          </div>
          {loading ? (
            <div className="loading-wrap">
              <SpinLoading color="primary" />
            </div>
          ) : data.entries.length === 0 ? (
            <div className="empty-wrap">
              <Empty description="当前范围暂无账目" />
            </div>
          ) : (
            <>
              <div className="table-head">
                <span>日期</span>
                <span>收支</span>
                <span>操作</span>
              </div>
              {data.entries.map((entry) => (
                <div className="entry-row" key={entry.id}>
                  <span>{entry.date}</span>
                  <span className="amount transaction-values">
                    <span className="income-amount">收：{entry.income}</span>
                    <span className="expense-amount">支：{entry.expense}</span>
                  </span>
                  <span className="row-actions">
                    <button
                      className="edit-button"
                      type="button"
                      disabled={deletingId === entry.id}
                      onClick={() => {
                        setModalEntry(entry);
                        setModalOpen(true);
                      }}
                    >
                      编辑
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      disabled={deletingId === entry.id}
                      onClick={() => deleteEntry(entry)}
                    >
                      {deletingId === entry.id ? "删除中" : "删除"}
                    </button>
                  </span>
                </div>
              ))}
            </>
          )}
        </section>
        {modalOpen && (
          <EntryModal
            entry={modalEntry}
            onClose={() => {
              setModalOpen(false);
              setModalEntry(undefined);
            }}
            onSaved={saveCompleted}
          />
        )}
      </div>
    </main>
  );
}
