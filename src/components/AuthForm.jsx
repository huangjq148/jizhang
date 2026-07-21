"use client";

import { useState } from "react";
import { Button, Input } from "antd-mobile";
import Link from "next/link";

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "操作失败");
      window.location.replace("/");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark"><div className="brand-icon">¥</div><span>小账本</span></div>
        <h1>{isRegister ? "创建你的账本" : "欢迎回来"}</h1>
        <p className="auth-subtitle">{isRegister ? "注册后开始记录每一笔支出" : "登录后查看你的账目明细"}</p>
        <form className="auth-form" onSubmit={submit}>
          <label><span className="field-label">用户名</span><Input value={form.username} onChange={update("username")} placeholder="请输入用户名" clearable /></label>
          <label><span className="field-label">密码</span><Input type="password" value={form.password} onChange={update("password")} placeholder="请输入密码（至少 6 位）" clearable /></label>
          {isRegister && <label><span className="field-label">确认密码</span><Input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="请再次输入密码" clearable /></label>}
          <div className="form-error">{error}</div>
          <Button block color="primary" size="large" type="submit" loading={loading}>{isRegister ? "注册并登录" : "登录"}</Button>
        </form>
        <p className="auth-footer">{isRegister ? "已有账号？" : "还没有账号？"}<Link href={isRegister ? "/login" : "/register"}>{isRegister ? "去登录" : "立即注册"}</Link></p>
        <p className="icp-filing"><a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">闽ICP备2022000916号-1</a></p>
      </section>
    </main>
  );
}
