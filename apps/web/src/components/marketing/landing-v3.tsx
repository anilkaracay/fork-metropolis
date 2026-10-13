// Landing v3, ported from docs/design/fork-design/landing-v3-reference/index.html.
// The scenes use the one illustrative story (mira, theo, lena, kaan) and say so. The nav
// count, the activity strip and the Monad figures are real: they come from the indexer
// read for this request and from the recorded run in docs/MONAD_PERFORMANCE.md.
/* eslint-disable @next/next/no-img-element -- static, pre-sized artwork */
import Link from "next/link";
import type { MeasuredRun } from "@/lib/measured";
import type { LandingLive } from "@/server/landing";
import { ActivityStrip, NavChip } from "./live-parts";

const ms = (value: number) => String(value);
// The chart's axis runs to 1.3 seconds, as in the reference.
const share = (value: number) => `${((value / 1300) * 100).toFixed(2)}%`;
const recorded = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export function LandingV3({
  live,
  run,
}: {
  live: LandingLive | null;
  run: MeasuredRun & { indexMedianMs: number };
}) {
  const ideas = live?.ideas ?? null;
  return (
    <div className="fk">
      <section
        className="dots"
        style={{ position: "relative", padding: "24px 0 120px" }}
      >
        <div
          className="glow"
          style={{
            right: "-220px",
            top: "40px",
            width: "900px",
            height: "900px",
            background:
              "radial-gradient(circle,rgba(131,110,249,.28) 0%,rgba(131,110,249,.08) 38%,rgba(11,13,16,0) 66%)",
          }}
        ></div>
        <div className="wrap">
          <nav className="nav" aria-label="Main">
            <a
              href="#top"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#F2F4F2",
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <g
                  fill="none"
                  stroke="#B1D6AC"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="7" cy="4" r="2"></circle>
                  <circle cx="17" cy="4" r="2"></circle>
                  <circle cx="7" cy="20" r="2"></circle>
                  <path d="M7 6v12M17 6v3a5 5 0 0 1-5 5H7"></path>
                </g>
              </svg>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "-.02em",
                }}
              >
                FORK<span style={{ color: "#B1D6AC" }}>.</span>
              </span>
            </a>
            <div style={{ flex: 1 }}></div>
            <a className="l" href="#how">
              How it works
            </a>
            <a className="l" href="#backing">
              Backing
            </a>
            <a className="l" href="#tree">
              Idea Tree
            </a>
            <a className="l" href="#monad">
              Monad
            </a>
            <NavChip ideas={ideas} />
            <Link
              className="btn pri"
              style={{ height: "44px", padding: "0 18px" }}
              href="/feed"
              prefetch={false}
            >
              Open FORK
            </Link>
          </nav>
          <div id="top" className="hero" style={{ marginTop: "110px" }}>
            <div>
              <p className="kick">A social network for trading ideas</p>
              <h1 className="h1 heroL" style={{ marginTop: "22px" }}>
                <span style={{ whiteSpace: "nowrap" }}>Trading ideas</span>
                <br />
                <span className="grad flow" style={{ whiteSpace: "nowrap" }}>
                  evolve here.
                </span>
              </h1>
              <p className="lead" style={{ fontSize: "22px" }}>
                Publish an idea. Fork a better one. Back the ones you believe
                in, and the backing is split onchain between everyone who shaped
                it.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  marginTop: "38px",
                  flexWrap: "wrap",
                }}
              >
                <Link className="btn pri" href="/feed" prefetch={false}>
                  Open FORK <span aria-hidden="true">→</span>
                </Link>
                <a className="btn sec2" href="#how">
                  See how it works
                </a>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "34px",
                  marginTop: "56px",
                  flexWrap: "wrap",
                }}
              >
                <p
                  className="eb"
                  style={{ color: "#858D88", fontSize: "12px" }}
                >
                  Built on
                </p>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <img
                    src="/landing/tokens/mon.svg"
                    alt=""
                    style={{ width: "28px", height: "28px" }}
                  />
                  <span style={{ fontSize: "20px", fontWeight: 600 }}>
                    Monad
                  </span>
                </div>
                <img
                  src="/landing/logos/envio.png"
                  alt="Envio"
                  style={{ height: "24px", width: "auto" }}
                />
                <img
                  src="/landing/logos/privy-light.png"
                  alt="Privy"
                  style={{ height: "28px", width: "auto" }}
                />
              </div>
            </div>
            <div
              className="stage stageP"
              aria-label="An example of one idea being forked and backed"
            >
              <svg
                width="560"
                height="600"
                viewBox="0 0 560 600"
                style={{ position: "absolute", left: "0", top: "0" }}
                aria-hidden="true"
              >
                <path
                  className="a-branch"
                  d="M56 232 V 370 Q 56 410 96 410 H 140"
                  fill="none"
                  stroke="#B1D6AC"
                  strokeWidth="3"
                  strokeLinecap="round"
                ></path>
                <circle cx="56" cy="232" r="7" fill="#B1D6AC"></circle>
              </svg>
              <div className="icard a-ring" style={{ left: "0", top: "0" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <img
                    className="av"
                    src="/landing/avatars/mira.svg"
                    alt="mira"
                    style={{ width: "44px", height: "44px" }}
                  />
                  <p style={{ margin: "0", fontSize: "18px", fontWeight: 600 }}>
                    @mira
                  </p>
                  <div style={{ flex: 1 }}></div>
                  <p
                    className="mono l3-label"
                    style={{ margin: "0", fontSize: "13px", color: "#858D88" }}
                  >
                    Original
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <img
                    src="/landing/tokens/mon.svg"
                    alt="MON"
                    style={{ width: "34px", height: "34px" }}
                  />
                  <p
                    style={{
                      margin: "0",
                      fontSize: "28px",
                      fontWeight: 600,
                      letterSpacing: "-.02em",
                    }}
                  >
                    MON
                  </p>
                  <span className="pill">LONG</span>
                </div>
                <div style={{ display: "flex", gap: "56px" }}>
                  <div>
                    <p className="k">Target</p>
                    <p className="big" style={{ color: "#F2F4F2" }}>
                      $0.040
                    </p>
                  </div>
                  <div>
                    <p className="k">Leverage</p>
                    <p className="big" style={{ color: "#F2F4F2" }}>
                      2×
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderTop: "1px solid #2A2F37",
                    paddingTop: "14px",
                    minHeight: "44px",
                  }}
                >
                  <div
                    className="a-earn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3 L21 12 L12 21 L3 12 Z"
                        fill="none"
                        stroke="#C5B6FF"
                        strokeWidth="2.4"
                      ></path>
                    </svg>
                    <p
                      className="mono"
                      style={{
                        margin: "0",
                        fontSize: "15px",
                        color: "#C5B6FF",
                      }}
                    >
                      +0.02 MON from forks
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="icard fk2 a-card"
                style={{ left: "140px", top: "300px" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <img
                    className="av"
                    src="/landing/avatars/theo.svg"
                    alt="theo"
                    style={{ width: "44px", height: "44px" }}
                  />
                  <p style={{ margin: "0", fontSize: "18px", fontWeight: 600 }}>
                    @theo
                  </p>
                  <div style={{ flex: 1 }}></div>
                  <p
                    className="mono l3-label"
                    style={{ margin: "0", fontSize: "13px", color: "#B1D6AC" }}
                  >
                    Forked from @mira
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <img
                    src="/landing/tokens/mon.svg"
                    alt="MON"
                    style={{ width: "34px", height: "34px" }}
                  />
                  <p
                    style={{
                      margin: "0",
                      fontSize: "28px",
                      fontWeight: 600,
                      letterSpacing: "-.02em",
                    }}
                  >
                    MON
                  </p>
                  <span className="pill">LONG</span>
                </div>
                <div style={{ display: "flex", gap: "56px" }}>
                  <div>
                    <p className="k">Target</p>
                    <p className="big" style={{ color: "#B1D6AC" }}>
                      $0.045
                    </p>
                  </div>
                  <div>
                    <p className="k">Leverage</p>
                    <p className="big" style={{ color: "#B1D6AC" }}>
                      3×
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderTop: "1px solid #2A2F37",
                    paddingTop: "14px",
                    minHeight: "44px",
                  }}
                >
                  <div style={{ display: "flex", gap: "6px" }}>
                    <img
                      className="av a-p1"
                      src="/landing/avatars/kaan.svg"
                      alt="kaan"
                      style={{ width: "34px", height: "34px" }}
                    />
                    <img
                      className="av a-p2"
                      src="/landing/avatars/deniz.svg"
                      alt="deniz"
                      style={{ width: "34px", height: "34px" }}
                    />
                    <img
                      className="av a-p3"
                      src="/landing/avatars/umut.svg"
                      alt="umut"
                      style={{ width: "34px", height: "34px" }}
                    />
                  </div>
                  <p
                    className="mono a-backed"
                    style={{ margin: "0", fontSize: "15px", color: "#C5B6FF" }}
                  >
                    backed 0.1 MON
                  </p>
                </div>
              </div>
              <div
                className="a-coin"
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: "26px",
                  height: "26px",
                  margin: "-13px 0 0 -13px",
                  borderRadius: "50%",
                  background: "#C5B6FF",
                  boxShadow: "0 0 18px rgba(197,182,255,.9)",
                }}
              ></div>
              <p
                style={{
                  position: "absolute",
                  left: "0",
                  top: "596px",
                  margin: "0",
                  fontSize: "13px",
                  color: "#858D88",
                }}
              >
                Example
              </p>
            </div>
          </div>
        </div>
      </section>
      {live && <ActivityStrip events={live.events} now={live.readAt} />}
      <section style={{ padding: "40px 0" }}>
        <div className="inset light dots" style={{ padding: "120px 0" }}>
          <div className="wrap g2" style={{ alignItems: "stretch" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "48px",
              }}
            >
              <div className="rv">
                <p className="kick" style={{ color: "#2E6A37" }}>
                  The problem
                </p>
                <h2
                  className="h2b"
                  style={{ fontSize: "clamp(40px,4.6vw,66px)" }}
                >
                  In a thread, the best reply disappears.
                </h2>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                }}
              >
                <div
                  className="rv"
                  style={{
                    display: "flex",
                    gap: "18px",
                    borderTop: "1px solid #D3D8CF",
                    paddingTop: "20px",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      background: "#B1D6AC",
                      color: "#12151A",
                      borderRadius: "999px",
                      padding: "3px 10px",
                      height: "24px",
                    }}
                  >
                    01
                  </span>
                  <div>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "22px",
                        fontWeight: 600,
                        letterSpacing: "-.01em",
                      }}
                    >
                      The improvement is buried
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "17px",
                        lineHeight: "1.5",
                        color: "#4F5751",
                      }}
                    >
                      A better target or a tighter stop is a reply, and replies
                      scroll away.
                    </p>
                  </div>
                </div>
                <div
                  className="rv"
                  style={{
                    display: "flex",
                    gap: "18px",
                    borderTop: "1px solid #D3D8CF",
                    paddingTop: "20px",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      background: "#FFE38F",
                      color: "#12151A",
                      borderRadius: "999px",
                      padding: "3px 10px",
                      height: "24px",
                    }}
                  >
                    02
                  </span>
                  <div>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "22px",
                        fontWeight: 600,
                        letterSpacing: "-.01em",
                      }}
                    >
                      The credit is lost
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "17px",
                        lineHeight: "1.5",
                        color: "#4F5751",
                      }}
                    >
                      A week later, nobody can say who changed what.
                    </p>
                  </div>
                </div>
                <div
                  className="rv"
                  style={{
                    display: "flex",
                    gap: "18px",
                    borderTop: "1px solid #D3D8CF",
                    paddingTop: "20px",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      background: "#C5B6FF",
                      color: "#12151A",
                      borderRadius: "999px",
                      padding: "3px 10px",
                      height: "24px",
                    }}
                  >
                    03
                  </span>
                  <div>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "22px",
                        fontWeight: 600,
                        letterSpacing: "-.01em",
                      }}
                    >
                      The upside goes nowhere
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "17px",
                        lineHeight: "1.5",
                        color: "#4F5751",
                      }}
                    >
                      The person who made the idea better shares in none of what
                      it draws.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="rv2"
              style={{
                background: "#FBFBF8",
                border: "1px solid #D3D8CF",
                borderRadius: "30px",
                padding: "24px 26px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 40px 90px rgba(18,21,26,.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderBottom: "1px solid #D3D8CF",
                  paddingBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#12151A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src="/landing/tokens/mon.svg"
                    alt=""
                    style={{ width: "20px", height: "20px" }}
                  />
                </div>
                <span style={{ fontSize: "18px", fontWeight: 600 }}>
                  mon traders
                </span>
                <div style={{ flex: 1 }}></div>
                <span style={{ fontSize: "13px", color: "#4F5751" }}>
                  Example
                </span>
              </div>
              <div
                className="rv"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  opacity: 1,
                }}
              >
                <img
                  className="av"
                  src="/landing/avatars/mira.svg"
                  alt="mira"
                  style={{ width: "40px", height: "40px" }}
                />
                <div
                  className=""
                  style={{
                    background: "#EEF0EB",
                    border: "1px solid #E6E9E2",
                    padding: "12px 18px",
                    borderRadius: "20px 20px 20px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#7A5D00",
                      }}
                    >
                      mira
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "17px",
                      lineHeight: "1.4",
                      color: "#12151A",
                    }}
                  >
                    MON long. Target $0.040, out below $0.030, 2x.
                  </p>
                </div>
              </div>
              <div
                className="rv2"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  opacity: 1,
                }}
              >
                <img
                  className="av"
                  src="/landing/avatars/deniz.svg"
                  alt="deniz"
                  style={{ width: "40px", height: "40px" }}
                />
                <div
                  className=""
                  style={{
                    background: "#EEF0EB",
                    border: "1px solid #E6E9E2",
                    padding: "12px 18px",
                    borderRadius: "20px 20px 20px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#2E6A37",
                      }}
                    >
                      deniz
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "17px",
                      lineHeight: "1.4",
                      color: "#12151A",
                    }}
                  >
                    gm, watching this
                  </p>
                </div>
              </div>
              <div
                className="rv2"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  opacity: 1,
                }}
              >
                <img
                  className="av"
                  src="/landing/avatars/theo.svg"
                  alt="theo"
                  style={{ width: "40px", height: "40px" }}
                />
                <div
                  className="hl"
                  style={{
                    background: "#FFF1E8",
                    border: "2px solid #F0A57E",
                    padding: "12px 18px",
                    borderRadius: "20px 20px 20px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#B4531F",
                      }}
                    >
                      theo
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#5A260C",
                        background: "#F7C3A6",
                        padding: "2px 10px",
                        borderRadius: "999px",
                      }}
                    >
                      The better version
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "17px",
                      lineHeight: "1.4",
                      color: "#12151A",
                    }}
                  >
                    Target is too low. If $0.030 holds I would take $0.045 at
                    3x.
                  </p>
                </div>
              </div>
              <div
                className="rv3"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  opacity: 0.8,
                }}
              >
                <img
                  className="av"
                  src="/landing/avatars/umut.svg"
                  alt="umut"
                  style={{ width: "40px", height: "40px" }}
                />
                <div
                  className=""
                  style={{
                    background: "#EEF0EB",
                    border: "1px solid #E6E9E2",
                    padding: "12px 18px",
                    borderRadius: "20px 20px 20px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#8C2F55",
                      }}
                    >
                      umut
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "17px",
                      lineHeight: "1.4",
                      color: "#12151A",
                    }}
                  >
                    anyone looking at SOL?
                  </p>
                </div>
              </div>
              <div
                className="rv4"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  opacity: 0.7,
                }}
              >
                <img
                  className="av"
                  src="/landing/avatars/ada.svg"
                  alt="ada"
                  style={{ width: "40px", height: "40px" }}
                />
                <div
                  className=""
                  style={{
                    background: "#EEF0EB",
                    border: "1px solid #E6E9E2",
                    padding: "12px 18px",
                    borderRadius: "20px 20px 20px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1F5F50",
                      }}
                    >
                      ada
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "17px",
                      lineHeight: "1.4",
                      color: "#12151A",
                    }}
                  >
                    wen
                  </p>
                </div>
              </div>
              <div style={{ flex: 1 }}></div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#FBFBF8",
                    background: "#12151A",
                    padding: "6px 16px",
                    borderRadius: "999px",
                  }}
                >
                  New messages ↓
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="sec" style={{ padding: "140px 0 100px" }}>
        <div
          className="glow"
          style={{
            left: "-200px",
            top: "0",
            width: "900px",
            height: "900px",
            background:
              "radial-gradient(circle,rgba(177,214,172,.16) 0%,rgba(177,214,172,.04) 40%,rgba(11,13,16,0) 68%)",
          }}
        ></div>
        <div className="wrap g2" style={{ position: "relative" }}>
          <div className="rv">
            <p className="kick">The idea behind FORK</p>
            <h2 className="h2b" style={{ fontSize: "clamp(44px,5.4vw,80px)" }}>
              Version control for{" "}
              <span className="grad flow">trading ideas.</span>
            </h2>
            <p className="lead">
              Code got a history once every change kept its author and its
              parent. FORK gives trading ideas that history, and adds what Git
              never had: backing that pays everyone along it.
            </p>
          </div>
          <div
            style={{
              position: "relative",
              height: "470px",
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <svg
              width="600"
              height="470"
              viewBox="0 0 600 470"
              style={{
                position: "absolute",
                left: "0",
                top: "0",
                overflow: "visible",
              }}
              aria-hidden="true"
            >
              <g
                fill="none"
                stroke="#B1D6AC"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path
                  className="dr"
                  pathLength="1"
                  d="M20 44 V 172 Q 20 196 44 196 H 70"
                ></path>
                <path
                  className="dr"
                  pathLength="1"
                  d="M70 196 V 324 Q 70 348 94 348 H 120"
                ></path>
                <path
                  d="M20 44 V 440"
                  strokeOpacity=".25"
                  strokeDasharray="2 10"
                ></path>
              </g>
              <g fill="#B1D6AC">
                <circle cx="20" cy="44" r="8"></circle>
                <circle cx="70" cy="196" r="8"></circle>
                <circle cx="120" cy="348" r="8"></circle>
              </g>
              <g fill="#0B0D10">
                <circle cx="20" cy="44" r="3"></circle>
                <circle cx="70" cy="196" r="3"></circle>
                <circle cx="120" cy="348" r="3"></circle>
              </g>
            </svg>
            <div
              className="rv"
              style={{
                position: "absolute",
                left: "48px",
                top: "6px",
                width: "540px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                background: "#14171C",
                border: "1px solid #2A2F37",
                borderRadius: "18px",
                padding: "14px 18px",
                boxShadow: "0 24px 60px rgba(0,0,0,.45)",
              }}
            >
              <img
                className="av"
                src="/landing/avatars/mira.svg"
                alt="mira"
                style={{ width: "42px", height: "42px" }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0", fontSize: "17px" }}>
                  <b>mira</b>{" "}
                  <span style={{ color: "#A4ABA7" }}>published</span>
                </p>
                <p
                  className="mono"
                  style={{
                    margin: "4px 0 0",
                    fontSize: "15px",
                    color: "#FFE38F",
                  }}
                >
                  MON long · $0.040 · 2×
                </p>
              </div>
              <span
                className="mono"
                style={{ fontSize: "15px", color: "#858D88" }}
              >
                #1
              </span>
            </div>
            <div
              className="rv"
              style={{
                position: "absolute",
                left: "98px",
                top: "158px",
                width: "490px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                background: "#14171C",
                border: "1px solid #2A2F37",
                borderRadius: "18px",
                padding: "14px 18px",
                boxShadow: "0 24px 60px rgba(0,0,0,.45)",
              }}
            >
              <img
                className="av"
                src="/landing/avatars/theo.svg"
                alt="theo"
                style={{ width: "42px", height: "42px" }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0", fontSize: "17px" }}>
                  <b>theo</b>{" "}
                  <span style={{ color: "#A4ABA7" }}>forked #1</span>
                </p>
                <p
                  className="mono"
                  style={{
                    margin: "4px 0 0",
                    fontSize: "15px",
                    color: "#B1D6AC",
                  }}
                >
                  target $0.045 · 3×
                </p>
              </div>
              <span
                className="mono"
                style={{ fontSize: "15px", color: "#858D88" }}
              >
                #2
              </span>
            </div>
            <div
              className="rv"
              style={{
                position: "absolute",
                left: "148px",
                top: "310px",
                width: "440px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                background: "#14171C",
                border: "1px solid #2A2F37",
                borderRadius: "18px",
                padding: "14px 18px",
                boxShadow: "0 24px 60px rgba(0,0,0,.45)",
              }}
            >
              <img
                className="av"
                src="/landing/avatars/lena.svg"
                alt="lena"
                style={{ width: "42px", height: "42px" }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0", fontSize: "17px" }}>
                  <b>lena</b>{" "}
                  <span style={{ color: "#A4ABA7" }}>forked #2</span>
                </p>
                <p
                  className="mono"
                  style={{
                    margin: "4px 0 0",
                    fontSize: "15px",
                    color: "#9FD3FF",
                  }}
                >
                  target $0.048 · 3×
                </p>
              </div>
              <span
                className="mono"
                style={{ fontSize: "15px", color: "#858D88" }}
              >
                #3
              </span>
            </div>
            <p
              className="rv"
              style={{
                position: "absolute",
                left: "48px",
                top: "432px",
                margin: "0",
                fontSize: "15px",
                color: "#A4ABA7",
              }}
            >
              Backing lena’s idea pays theo and mira too.
            </p>
          </div>
        </div>
      </section>
      <section id="how" className="sec" style={{ padding: "120px 0" }}>
        <div className="wrap">
          <div className="rv" style={{ maxWidth: "760px" }}>
            <p className="kick">How it works</p>
            <h2 className="h2b">Four actions on one public graph</h2>
          </div>
          <div className="story storyw" style={{ marginTop: "40px" }}>
            <div>
              <div className="stepx st1">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      background: "#FFE38F",
                      color: "#0B0D10",
                      borderRadius: "999px",
                      padding: "3px 10px",
                    }}
                  >
                    01
                  </span>
                  <span style={{ fontSize: "15px", color: "#FFE38F" }}>
                    Step 1
                  </span>
                </div>
                <h3 style={{ color: "#F2F4F2" }}>Publish</h3>
                <p>
                  An idea is a market, a direction, a target, an invalidation, a
                  leverage and the reasoning. Your wallet signs it, and Monad
                  records you as the author.
                </p>
                <div className="vis-inline" style={{ maxWidth: "420px" }}>
                  <div
                    className="card"
                    style={{
                      height: "190px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "20px 22px",
                      background: "#161A20",
                      borderColor: "#2A2F37",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/mira.svg"
                        alt="mira"
                        style={{ width: "32px", height: "32px" }}
                      />
                      <span style={{ fontSize: "16px", fontWeight: 600 }}>
                        @mira
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono"
                        style={{ fontSize: "14px", color: "#858D88" }}
                      >
                        #1
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        src="/landing/tokens/mon.svg"
                        alt=""
                        style={{ width: "26px", height: "26px" }}
                      />
                      <span style={{ fontSize: "22px", fontWeight: 600 }}>
                        MON
                      </span>
                      <span className="pill">LONG</span>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: "24px", color: "#FFE38F" }}
                    >
                      $0.040 · 2×
                    </span>
                  </div>
                </div>
              </div>
              <div className="stepx st2">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      background: "#B1D6AC",
                      color: "#0B0D10",
                      borderRadius: "999px",
                      padding: "3px 10px",
                    }}
                  >
                    02
                  </span>
                  <span style={{ fontSize: "15px", color: "#B1D6AC" }}>
                    Step 2
                  </span>
                </div>
                <h3 style={{ color: "#F2F4F2" }}>Fork</h3>
                <p>
                  Disagree with the target or the argument? Fork it. The new
                  idea keeps a permanent link to its parent, and everyone sees
                  what changed.
                </p>
                <div className="vis-inline" style={{ maxWidth: "420px" }}>
                  <div
                    className="card"
                    style={{
                      height: "190px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "20px 22px",
                      background: "#161A20",
                      borderColor: "#2A2F37",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/theo.svg"
                        alt="theo"
                        style={{ width: "32px", height: "32px" }}
                      />
                      <span style={{ fontSize: "16px", fontWeight: 600 }}>
                        @theo
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono l3-label"
                        style={{ fontSize: "14px", color: "#858D88" }}
                      >
                        forks #1
                      </span>
                    </div>
                    <div style={{ borderRadius: "10px", overflow: "hidden" }}>
                      <div
                        style={{ background: "#2A1719", padding: "8px 12px" }}
                      >
                        <span
                          className="mono"
                          style={{ fontSize: "17px", color: "#FFC9C9" }}
                        >
                          − $0.040 · 2×
                        </span>
                      </div>
                      <div
                        style={{ background: "#16261A", padding: "8px 12px" }}
                      >
                        <span
                          className="mono"
                          style={{ fontSize: "17px", color: "#B1D6AC" }}
                        >
                          + $0.045 · 3×
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="stepx st3">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      background: "#C5B6FF",
                      color: "#0B0D10",
                      borderRadius: "999px",
                      padding: "3px 10px",
                    }}
                  >
                    03
                  </span>
                  <span style={{ fontSize: "15px", color: "#C5B6FF" }}>
                    Step 3
                  </span>
                </div>
                <h3 style={{ color: "#F2F4F2" }}>Back</h3>
                <p>
                  Put MON behind an idea you believe in. One transaction splits
                  it between the author and the authors it grew from.
                </p>
                <div className="vis-inline" style={{ maxWidth: "420px" }}>
                  <div
                    className="card"
                    style={{
                      height: "190px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "20px 22px",
                      background: "#161A20",
                      borderColor: "#2A2F37",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/kaan.svg"
                        alt="kaan"
                        style={{ width: "32px", height: "32px" }}
                      />
                      <span style={{ fontSize: "16px", fontWeight: 600 }}>
                        @kaan
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono"
                        style={{ fontSize: "15px", color: "#C5B6FF" }}
                      >
                        0.1 MON
                      </span>
                    </div>
                    <div style={{ height: "1px", background: "#262B32" }}></div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/theo.svg"
                        alt="theo"
                        style={{ width: "26px", height: "26px" }}
                      />
                      <span style={{ fontSize: "15px" }}>theo</span>
                      <span style={{ fontSize: "13px", color: "#858D88" }}>
                        80%
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono"
                        style={{ fontSize: "18px", color: "#C5B6FF" }}
                      >
                        0.08
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/mira.svg"
                        alt="mira"
                        style={{ width: "26px", height: "26px" }}
                      />
                      <span style={{ fontSize: "15px" }}>mira</span>
                      <span style={{ fontSize: "13px", color: "#858D88" }}>
                        20%
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono"
                        style={{ fontSize: "18px", color: "#C5B6FF" }}
                      >
                        0.02
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="stepx st4">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      background: "#9FD3FF",
                      color: "#0B0D10",
                      borderRadius: "999px",
                      padding: "3px 10px",
                    }}
                  >
                    04
                  </span>
                  <span style={{ fontSize: "15px", color: "#9FD3FF" }}>
                    Step 4
                  </span>
                </div>
                <h3 style={{ color: "#F2F4F2" }}>Idea Tree</h3>
                <p>
                  Follow every branch of an idea in one view, with what changed
                  and the value that flowed back to earlier authors.
                </p>
                <div className="vis-inline" style={{ maxWidth: "420px" }}>
                  <div
                    className="card"
                    style={{
                      height: "190px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "20px 22px",
                      background: "#161A20",
                      borderColor: "#2A2F37",
                    }}
                  >
                    <div style={{ position: "relative", height: "150px" }}>
                      <svg
                        width="260"
                        height="150"
                        viewBox="0 0 260 150"
                        style={{ position: "absolute", left: "0", top: "0" }}
                        aria-hidden="true"
                      >
                        <g
                          fill="none"
                          stroke="#9FD3FF"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M14 30 V 64 Q 14 76 26 76 H 40"></path>
                          <path d="M54 94 V 116 Q 54 128 66 128 H 80"></path>
                        </g>
                      </svg>
                      <div
                        style={{
                          position: "absolute",
                          left: "0",
                          top: "0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "250px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/mira.svg"
                          alt="mira"
                          style={{ width: "28px", height: "28px" }}
                        />
                        <span style={{ fontSize: "15px" }}>mira</span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono"
                          style={{ fontSize: "15px", color: "#C5B6FF" }}
                        >
                          +0.02
                        </span>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          left: "40px",
                          top: "60px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "210px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/theo.svg"
                          alt="theo"
                          style={{ width: "28px", height: "28px" }}
                        />
                        <span style={{ fontSize: "15px" }}>theo</span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono"
                          style={{ fontSize: "15px", color: "#C5B6FF" }}
                        >
                          +0.08
                        </span>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          left: "80px",
                          top: "112px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "170px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/lena.svg"
                          alt="lena"
                          style={{ width: "28px", height: "28px" }}
                        />
                        <span style={{ fontSize: "15px" }}>lena</span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono"
                          style={{ fontSize: "14px", color: "#858D88" }}
                        >
                          #3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="stick">
                <div className="layer ly ly1">
                  <div className="bigtok">
                    <div
                      className="card"
                      style={{
                        height: "190px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "12px",
                        padding: "20px 22px",
                        background: "#161A20",
                        borderColor: "#2A2F37",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/mira.svg"
                          alt="mira"
                          style={{ width: "32px", height: "32px" }}
                        />
                        <span style={{ fontSize: "16px", fontWeight: 600 }}>
                          @mira
                        </span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono"
                          style={{ fontSize: "14px", color: "#858D88" }}
                        >
                          #1
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img
                          src="/landing/tokens/mon.svg"
                          alt=""
                          style={{ width: "26px", height: "26px" }}
                        />
                        <span style={{ fontSize: "22px", fontWeight: 600 }}>
                          MON
                        </span>
                        <span className="pill">LONG</span>
                      </div>
                      <span
                        className="mono"
                        style={{ fontSize: "24px", color: "#FFE38F" }}
                      >
                        $0.040 · 2×
                      </span>
                    </div>
                  </div>
                </div>
                <div className="layer ly ly2">
                  <div className="bigtok">
                    <div
                      className="card"
                      style={{
                        height: "190px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "12px",
                        padding: "20px 22px",
                        background: "#161A20",
                        borderColor: "#2A2F37",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/theo.svg"
                          alt="theo"
                          style={{ width: "32px", height: "32px" }}
                        />
                        <span style={{ fontSize: "16px", fontWeight: 600 }}>
                          @theo
                        </span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono l3-label"
                          style={{ fontSize: "14px", color: "#858D88" }}
                        >
                          forks #1
                        </span>
                      </div>
                      <div style={{ borderRadius: "10px", overflow: "hidden" }}>
                        <div
                          style={{ background: "#2A1719", padding: "8px 12px" }}
                        >
                          <span
                            className="mono"
                            style={{ fontSize: "17px", color: "#FFC9C9" }}
                          >
                            − $0.040 · 2×
                          </span>
                        </div>
                        <div
                          style={{ background: "#16261A", padding: "8px 12px" }}
                        >
                          <span
                            className="mono"
                            style={{ fontSize: "17px", color: "#B1D6AC" }}
                          >
                            + $0.045 · 3×
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="layer ly ly3">
                  <div className="bigtok">
                    <div
                      className="card"
                      style={{
                        height: "190px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "12px",
                        padding: "20px 22px",
                        background: "#161A20",
                        borderColor: "#2A2F37",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/kaan.svg"
                          alt="kaan"
                          style={{ width: "32px", height: "32px" }}
                        />
                        <span style={{ fontSize: "16px", fontWeight: 600 }}>
                          @kaan
                        </span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono"
                          style={{ fontSize: "15px", color: "#C5B6FF" }}
                        >
                          0.1 MON
                        </span>
                      </div>
                      <div
                        style={{ height: "1px", background: "#262B32" }}
                      ></div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/theo.svg"
                          alt="theo"
                          style={{ width: "26px", height: "26px" }}
                        />
                        <span style={{ fontSize: "15px" }}>theo</span>
                        <span style={{ fontSize: "13px", color: "#858D88" }}>
                          80%
                        </span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono"
                          style={{ fontSize: "18px", color: "#C5B6FF" }}
                        >
                          0.08
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/mira.svg"
                          alt="mira"
                          style={{ width: "26px", height: "26px" }}
                        />
                        <span style={{ fontSize: "15px" }}>mira</span>
                        <span style={{ fontSize: "13px", color: "#858D88" }}>
                          20%
                        </span>
                        <div style={{ flex: 1 }}></div>
                        <span
                          className="mono"
                          style={{ fontSize: "18px", color: "#C5B6FF" }}
                        >
                          0.02
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="layer ly ly4">
                  <div className="bigtok">
                    <div
                      className="card"
                      style={{
                        height: "190px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "12px",
                        padding: "20px 22px",
                        background: "#161A20",
                        borderColor: "#2A2F37",
                      }}
                    >
                      <div style={{ position: "relative", height: "150px" }}>
                        <svg
                          width="260"
                          height="150"
                          viewBox="0 0 260 150"
                          style={{ position: "absolute", left: "0", top: "0" }}
                          aria-hidden="true"
                        >
                          <g
                            fill="none"
                            stroke="#9FD3FF"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <path d="M14 30 V 64 Q 14 76 26 76 H 40"></path>
                            <path d="M54 94 V 116 Q 54 128 66 128 H 80"></path>
                          </g>
                        </svg>
                        <div
                          style={{
                            position: "absolute",
                            left: "0",
                            top: "0",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "250px",
                          }}
                        >
                          <img
                            className="av"
                            src="/landing/avatars/mira.svg"
                            alt="mira"
                            style={{ width: "28px", height: "28px" }}
                          />
                          <span style={{ fontSize: "15px" }}>mira</span>
                          <div style={{ flex: 1 }}></div>
                          <span
                            className="mono"
                            style={{ fontSize: "15px", color: "#C5B6FF" }}
                          >
                            +0.02
                          </span>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            left: "40px",
                            top: "60px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "210px",
                          }}
                        >
                          <img
                            className="av"
                            src="/landing/avatars/theo.svg"
                            alt="theo"
                            style={{ width: "28px", height: "28px" }}
                          />
                          <span style={{ fontSize: "15px" }}>theo</span>
                          <div style={{ flex: 1 }}></div>
                          <span
                            className="mono"
                            style={{ fontSize: "15px", color: "#C5B6FF" }}
                          >
                            +0.08
                          </span>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            left: "80px",
                            top: "112px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "170px",
                          }}
                        >
                          <img
                            className="av"
                            src="/landing/avatars/lena.svg"
                            alt="lena"
                            style={{ width: "28px", height: "28px" }}
                          />
                          <span style={{ fontSize: "15px" }}>lena</span>
                          <div style={{ flex: 1 }}></div>
                          <span
                            className="mono"
                            style={{ fontSize: "14px", color: "#858D88" }}
                          >
                            #3
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        id="backing"
        className="sec"
        style={{ padding: "110px 0", background: "#0D1013" }}
      >
        <div className="wrap">
          <div className="rv" style={{ maxWidth: "760px" }}>
            <p className="kick" style={{ color: "#C5B6FF" }}>
              Built for ideas that grow
            </p>
            <h2 className="h2b">
              Every change has an author. Every backing finds them.
            </h2>
          </div>
          <div className="bento stg" style={{ marginTop: "56px" }}>
            <div className="bx s4" style={{}}>
              <h3>Every fork shows exactly what changed</h3>
              <p className="d">
                A fork is a new idea with a permanent link to its parent. The
                original author stays on it.
              </p>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  marginTop: "18px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    background: "#0B0D10",
                    border: "1px solid #232830",
                    borderBottom: "none",
                    borderRadius: "18px 18px 0 0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "14px 20px",
                      borderBottom: "1px solid #232830",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/mira.svg"
                      alt="mira"
                      style={{ width: "26px", height: "26px" }}
                    />
                    <span
                      className="mono"
                      style={{ fontSize: "14px", color: "#A4ABA7" }}
                    >
                      #1
                    </span>
                    <span style={{ color: "#858D88" }}>→</span>
                    <img
                      className="av"
                      src="/landing/avatars/theo.svg"
                      alt="theo"
                      style={{ width: "26px", height: "26px" }}
                    />
                    <span
                      className="mono"
                      style={{ fontSize: "14px", color: "#A4ABA7" }}
                    >
                      #2
                    </span>
                    <div style={{ flex: 1 }}></div>
                    <span
                      className="mono"
                      style={{
                        fontSize: "12px",
                        color: "#B1D6AC",
                        background: "#16261A",
                        padding: "3px 10px",
                        borderRadius: "999px",
                      }}
                    >
                      3 changes
                    </span>
                  </div>
                  <div
                    className="rv"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#2A1719",
                      padding: "12px 26px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#FF9E9E",
                        width: "36px",
                      }}
                    >
                      −
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#A4ABA7",
                        width: "200px",
                      }}
                    >
                      target
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "19px", color: "#FFC9C9" }}
                    >
                      $0.040
                    </span>
                  </div>
                  <div
                    className="rv"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#16261A",
                      padding: "12px 26px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#B1D6AC",
                        width: "36px",
                      }}
                    >
                      +
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#A4ABA7",
                        width: "200px",
                      }}
                    >
                      target
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "19px", color: "#B1D6AC" }}
                    >
                      $0.045
                    </span>
                  </div>
                  <div
                    className="rv"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#2A1719",
                      padding: "12px 26px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#FF9E9E",
                        width: "36px",
                      }}
                    >
                      −
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#A4ABA7",
                        width: "200px",
                      }}
                    >
                      leverage
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "19px", color: "#FFC9C9" }}
                    >
                      2×
                    </span>
                  </div>
                  <div
                    className="rv"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#16261A",
                      padding: "12px 26px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#B1D6AC",
                        width: "36px",
                      }}
                    >
                      +
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#A4ABA7",
                        width: "200px",
                      }}
                    >
                      leverage
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "19px", color: "#B1D6AC" }}
                    >
                      3×
                    </span>
                  </div>
                  <div
                    className="rv"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#1E1B33",
                      padding: "12px 26px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#C5B6FF",
                        width: "36px",
                      }}
                    >
                      ~
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "19px",
                        color: "#A4ABA7",
                        width: "200px",
                      }}
                    >
                      reasoning
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "19px", color: "#C5B6FF" }}
                    >
                      rewritten by theo
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bx s2" style={{}}>
              <h3>See the split before you sign</h3>
              <p className="d">Who receives what, read from the contract.</p>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  marginTop: "18px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "24px 24px 0 0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "#12161A",
                      border: "1px solid #2A2F37",
                      borderRadius: "24px 24px 0 0",
                      padding: "22px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      boxShadow: "0 40px 100px rgba(0,0,0,.6)",
                    }}
                  >
                    <p
                      className="eb"
                      style={{ color: "#858D88", fontSize: "12px" }}
                    >
                      Idea #3
                    </p>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "24px",
                        fontWeight: 600,
                        letterSpacing: "-.02em",
                      }}
                    >
                      Back @lena’s idea
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span
                        className="mono"
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: "15px",
                          border: "1px solid #2A2F37",
                          color: "#F2F4F2",
                          padding: "8px 0",
                          borderRadius: "10px",
                        }}
                      >
                        0.05
                      </span>
                      <span
                        className="mono"
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: "15px",
                          border: "2px solid #B1D6AC",
                          background: "#16261A",
                          color: "#B1D6AC",
                          padding: "8px 0",
                          borderRadius: "10px",
                        }}
                      >
                        0.1
                      </span>
                      <span
                        className="mono"
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: "15px",
                          border: "1px solid #2A2F37",
                          color: "#F2F4F2",
                          padding: "8px 0",
                          borderRadius: "10px",
                        }}
                      >
                        0.25
                      </span>
                      <span
                        className="mono l3-label"
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: "15px",
                          border: "1px solid #2A2F37",
                          color: "#F2F4F2",
                          padding: "8px 0",
                          borderRadius: "10px",
                        }}
                      >
                        Custom
                      </span>
                    </div>
                    <p
                      className="eb"
                      style={{ color: "#858D88", fontSize: "12px" }}
                    >
                      Where it goes
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/lena.svg"
                          alt="lena"
                          style={{ width: "34px", height: "34px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "16px",
                              fontWeight: 600,
                            }}
                          >
                            @lena
                          </p>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "13px",
                              color: "#858D88",
                            }}
                          >
                            wrote this idea
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            className="mono"
                            style={{ margin: "0", fontSize: "18px" }}
                          >
                            0.07
                          </p>
                          <p
                            className="mono"
                            style={{
                              margin: "0",
                              fontSize: "12px",
                              color: "#858D88",
                            }}
                          >
                            70%
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "#1E242B",
                          borderRadius: "2px",
                        }}
                      >
                        <div
                          className="gx"
                          style={{
                            width: "70%",
                            height: "4px",
                            background: "#B1D6AC",
                            borderRadius: "2px",
                          }}
                        ></div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/theo.svg"
                          alt="theo"
                          style={{ width: "34px", height: "34px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "16px",
                              fontWeight: 600,
                            }}
                          >
                            @theo
                          </p>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "13px",
                              color: "#858D88",
                            }}
                          >
                            wrote #2, its parent
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            className="mono"
                            style={{ margin: "0", fontSize: "18px" }}
                          >
                            0.02
                          </p>
                          <p
                            className="mono"
                            style={{
                              margin: "0",
                              fontSize: "12px",
                              color: "#858D88",
                            }}
                          >
                            20%
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "#1E242B",
                          borderRadius: "2px",
                        }}
                      >
                        <div
                          className="gx"
                          style={{
                            width: "20%",
                            height: "4px",
                            background: "#B1D6AC",
                            borderRadius: "2px",
                          }}
                        ></div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <img
                          className="av"
                          src="/landing/avatars/mira.svg"
                          alt="mira"
                          style={{ width: "34px", height: "34px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "16px",
                              fontWeight: 600,
                            }}
                          >
                            @mira
                          </p>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "13px",
                              color: "#858D88",
                            }}
                          >
                            wrote #1, the original
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            className="mono"
                            style={{ margin: "0", fontSize: "18px" }}
                          >
                            0.01
                          </p>
                          <p
                            className="mono"
                            style={{
                              margin: "0",
                              fontSize: "12px",
                              color: "#858D88",
                            }}
                          >
                            10%
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "#1E242B",
                          borderRadius: "2px",
                        }}
                      >
                        <div
                          className="gx"
                          style={{
                            width: "10%",
                            height: "4px",
                            background: "#B1D6AC",
                            borderRadius: "2px",
                          }}
                        ></div>
                      </div>
                    </div>
                    <span
                      style={{
                        display: "block",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#0F1E10",
                        background: "#B1D6AC",
                        padding: "12px 0",
                        borderRadius: "12px",
                      }}
                    >
                      Back with 0.1 MON
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bx s6" style={{ paddingBottom: "0" }}>
              <h3>Backing pays the whole lineage</h3>
              <p className="d">
                One MON on lena’s idea pays lena, theo and mira in the same
                transaction: 70, 20 and 10.
              </p>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  marginTop: "18px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1200/330",
                    marginBottom: "30px",
                  }}
                >
                  <svg
                    viewBox="0 0 1200 380"
                    preserveAspectRatio="none"
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "0",
                      width: "100%",
                      height: "100%",
                    }}
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="ga2" x1="0" x2="1" y1="0" y2="0">
                        <stop
                          offset="0"
                          stopColor="#C5B6FF"
                          stopOpacity=".25"
                        ></stop>
                        <stop offset="1" stopColor="#C5B6FF"></stop>
                      </linearGradient>
                      <linearGradient id="gb2" x1="0" x2="1" y1="0" y2="0">
                        <stop
                          offset="0"
                          stopColor="#A391F2"
                          stopOpacity=".25"
                        ></stop>
                        <stop offset="1" stopColor="#A391F2"></stop>
                      </linearGradient>
                      <linearGradient id="gc2" x1="0" x2="1" y1="0" y2="0">
                        <stop
                          offset="0"
                          stopColor="#8270DD"
                          stopOpacity=".25"
                        ></stop>
                        <stop offset="1" stopColor="#8270DD"></stop>
                      </linearGradient>
                    </defs>
                    <g className="gx">
                      <path
                        d="M200 115 C 470 115, 450 2, 700 2 L 700 110 C 450 110, 470 222, 200 222 Z"
                        fill="url(#ga2)"
                      ></path>
                      <path
                        d="M200 222 C 470 222, 450 172, 700 172 L 700 203 C 450 203, 470 253, 200 253 Z"
                        fill="url(#gb2)"
                      ></path>
                      <path
                        d="M200 253 C 470 253, 450 326, 700 326 L 700 342 C 450 342, 470 268, 200 268 Z"
                        fill="url(#gc2)"
                      ></path>
                    </g>
                    <rect
                      x="186"
                      y="115"
                      width="14"
                      height="153"
                      rx="5"
                      fill="#C5B6FF"
                    ></rect>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "22%",
                      width: "15%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/kaan.svg"
                      alt="kaan"
                      style={{ width: "52px", height: "52px" }}
                    />
                    <p
                      className="mono"
                      style={{
                        margin: "0",
                        fontSize: "clamp(22px,2.6vw,38px)",
                        letterSpacing: "-.04em",
                        color: "#C5B6FF",
                      }}
                    >
                      1 MON
                    </p>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: "57%",
                      top: "0%",
                      width: "43%",
                      height: "29.5%",
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      background: "#14171C",
                      borderLeft: "5px solid #C5B6FF",
                      borderRadius: "18px",
                      padding: "0 24px",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/lena.svg"
                      alt="lena"
                      style={{ width: "52px", height: "52px" }}
                    />
                    <div style={{ flex: 1, minWidth: "0" }}>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "24px",
                          fontWeight: 600,
                        }}
                      >
                        lena
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "15px",
                          color: "#A4ABA7",
                        }}
                      >
                        wrote the idea
                      </p>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: "14px", color: "#858D88" }}
                    >
                      70%
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "38px",
                        letterSpacing: "-.04em",
                        color: "#C5B6FF",
                      }}
                    >
                      0.70
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: "57%",
                      top: "35%",
                      width: "43%",
                      height: "29.5%",
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      background: "#14171C",
                      borderLeft: "5px solid #A391F2",
                      borderRadius: "18px",
                      padding: "0 24px",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/theo.svg"
                      alt="theo"
                      style={{ width: "52px", height: "52px" }}
                    />
                    <div style={{ flex: 1, minWidth: "0" }}>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "24px",
                          fontWeight: 600,
                        }}
                      >
                        theo
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "15px",
                          color: "#A4ABA7",
                        }}
                      >
                        wrote its parent
                      </p>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: "14px", color: "#858D88" }}
                    >
                      20%
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "38px",
                        letterSpacing: "-.04em",
                        color: "#A391F2",
                      }}
                    >
                      0.20
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: "57%",
                      top: "70.5%",
                      width: "43%",
                      height: "29.5%",
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      background: "#14171C",
                      borderLeft: "5px solid #8270DD",
                      borderRadius: "18px",
                      padding: "0 24px",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/mira.svg"
                      alt="mira"
                      style={{ width: "52px", height: "52px" }}
                    />
                    <div style={{ flex: 1, minWidth: "0" }}>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "24px",
                          fontWeight: 600,
                        }}
                      >
                        mira
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "15px",
                          color: "#A4ABA7",
                        }}
                      >
                        wrote the original
                      </p>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: "14px", color: "#858D88" }}
                    >
                      10%
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "38px",
                        letterSpacing: "-.04em",
                        color: "#8270DD",
                      }}
                    >
                      0.10
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div id="tree" className="bx s3">
              <h3>The Idea Tree</h3>
              <p className="d">
                Every branch in one view, with the value that flowed back up.
              </p>
              <div style={{ marginTop: "18px" }}>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "30px",
                    padding: "6px 0 30px 6px",
                  }}
                >
                  <div
                    className=""
                    style={{
                      position: "relative",
                      marginLeft: "0px",
                      background: "#161A20",
                      border: "1px solid #2A2F37",
                      borderRadius: "18px",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/mira.svg"
                        alt="mira"
                        style={{ width: "34px", height: "34px" }}
                      />
                      <span style={{ fontSize: "17px", fontWeight: 600 }}>
                        @mira
                      </span>
                      <span style={{ fontSize: "14px", color: "#858D88" }}>
                        #1
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        src="/landing/tokens/mon.svg"
                        alt=""
                        style={{ width: "22px", height: "22px" }}
                      />
                      <span className="mono" style={{ fontSize: "18px" }}>
                        $0.040 · 2×
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono"
                        style={{ fontSize: "16px", color: "#C5B6FF" }}
                      >
                        +0.12
                      </span>
                    </div>
                  </div>
                  <div
                    className=""
                    style={{
                      position: "relative",
                      marginLeft: "44px",
                      background: "#161A20",
                      border: "1px solid #2A2F37",
                      borderRadius: "18px",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "-30px",
                        top: "-42px",
                        width: "30px",
                        height: "76px",
                        borderLeft: "2px solid #9FD3FF",
                        borderBottom: "2px solid #9FD3FF",
                        borderBottomLeftRadius: "12px",
                      }}
                    ></div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/theo.svg"
                        alt="theo"
                        style={{ width: "34px", height: "34px" }}
                      />
                      <span style={{ fontSize: "17px", fontWeight: 600 }}>
                        @theo
                      </span>
                      <span style={{ fontSize: "14px", color: "#858D88" }}>
                        #2
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        src="/landing/tokens/mon.svg"
                        alt=""
                        style={{ width: "22px", height: "22px" }}
                      />
                      <span className="mono" style={{ fontSize: "18px" }}>
                        $0.045 · 3×
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono"
                        style={{ fontSize: "16px", color: "#C5B6FF" }}
                      >
                        +0.20
                      </span>
                    </div>
                  </div>
                  <div
                    className=""
                    style={{
                      position: "relative",
                      marginLeft: "88px",
                      background: "#161A20",
                      border: "2px solid #9FD3FF",
                      borderRadius: "18px",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "-30px",
                        top: "-42px",
                        width: "30px",
                        height: "76px",
                        borderLeft: "2px solid #9FD3FF",
                        borderBottom: "2px solid #9FD3FF",
                        borderBottomLeftRadius: "12px",
                      }}
                    ></div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        className="av"
                        src="/landing/avatars/lena.svg"
                        alt="lena"
                        style={{ width: "34px", height: "34px" }}
                      />
                      <span style={{ fontSize: "17px", fontWeight: 600 }}>
                        @lena
                      </span>
                      <span style={{ fontSize: "14px", color: "#858D88" }}>
                        #3
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        src="/landing/tokens/mon.svg"
                        alt=""
                        style={{ width: "22px", height: "22px" }}
                      />
                      <span className="mono" style={{ fontSize: "18px" }}>
                        $0.048 · 3×
                      </span>
                      <div style={{ flex: 1 }}></div>
                      <span
                        className="mono"
                        style={{ fontSize: "16px", color: "#FFE38F" }}
                      >
                        1 MON
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bx s3" style={{}}>
              <h3>Earned from forks</h3>
              <p className="d">
                Income that arrives because someone else improved your idea.
              </p>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  marginTop: "18px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    background: "#FBFCF9",
                    color: "#12151A",
                    borderRadius: "22px 22px 0 0",
                    padding: "22px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/mira.svg"
                      alt="mira"
                      style={{ width: "44px", height: "44px" }}
                    />
                    <span style={{ fontSize: "19px", fontWeight: 600 }}>
                      @mira
                    </span>
                  </div>
                  <p
                    className="mono"
                    style={{
                      margin: "0",
                      fontSize: "12px",
                      letterSpacing: ".18em",
                      color: "#5A47C4",
                    }}
                  >
                    EARNED FROM FORKS
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "64px",
                        lineHeight: "1",
                        letterSpacing: "-.06em",
                        color: "#5A47C4",
                      }}
                    >
                      0.12
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "20px", color: "#4F5751" }}
                    >
                      MON
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      borderTop: "1px solid #D3D8CF",
                      paddingTop: "12px",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/theo.svg"
                      alt="theo"
                      style={{ width: "32px", height: "32px" }}
                    />
                    <span style={{ fontSize: "17px", flex: 1 }}>
                      via theo’s fork
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "18px", color: "#5A47C4" }}
                    >
                      0.02
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      borderTop: "1px solid #D3D8CF",
                      paddingTop: "12px",
                    }}
                  >
                    <img
                      className="av"
                      src="/landing/avatars/lena.svg"
                      alt="lena"
                      style={{ width: "32px", height: "32px" }}
                    />
                    <span style={{ fontSize: "17px", flex: 1 }}>
                      via lena’s fork
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "18px", color: "#5A47C4" }}
                    >
                      0.10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section style={{ padding: "40px 0" }}>
        <div
          className="inset light dots"
          style={{ padding: "110px 0", backgroundColor: "#E7EAE3" }}
        >
          <div className="wrap">
            <div className="rv">
              <p className="kick" style={{ color: "#2E6A37" }}>
                Why onchain
              </p>
              <h2 className="h2b">Credit nobody can quietly change</h2>
            </div>
            <div
              className="g2"
              style={{
                marginTop: "64px",
                alignItems: "stretch",
                gridTemplateColumns: "minmax(0,.85fr) minmax(0,1.15fr)",
              }}
            >
              <div
                className="rv"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  background: "#F4F5F1",
                  border: "2px dashed #C9CEC5",
                  borderRadius: "26px",
                  padding: "26px 28px",
                }}
              >
                <p
                  style={{
                    margin: "0",
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#4F5751",
                  }}
                >
                  In a company database
                </p>
                <div
                  style={{
                    background: "#FBFCF9",
                    border: "1px solid #D3D8CF",
                    borderRadius: "16px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 20px",
                      borderBottom: "1px solid #D3D8CF",
                      background: "#FFF1E8",
                    }}
                  >
                    <span
                      style={{ fontSize: "17px", color: "#4F5751", flex: 1 }}
                    >
                      Author
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: "20px",
                          color: "#9AA19B",
                          textDecoration: "line-through",
                        }}
                      >
                        70%
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: "20px", color: "#A3431A" }}
                      >
                        50%
                      </span>
                      <span
                        className="caret"
                        style={{
                          width: "2px",
                          height: "24px",
                          background: "#C2541E",
                          display: "inline-block",
                        }}
                      ></span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 20px",
                      borderBottom: "1px solid #D3D8CF",
                    }}
                  >
                    <span
                      style={{ fontSize: "17px", color: "#4F5751", flex: 1 }}
                    >
                      Parent’s author
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "20px", color: "#4F5751" }}
                    >
                      20%
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 20px",
                    }}
                  >
                    <span
                      style={{ fontSize: "17px", color: "#4F5751", flex: 1 }}
                    >
                      Grandparent’s author
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "20px", color: "#4F5751" }}
                    >
                      10%
                    </span>
                  </div>
                </div>
                <p style={{ margin: "0", fontSize: "16px", color: "#A3431A" }}>
                  Changed by an admin, after people backed it
                </p>
                <div style={{ flex: 1 }}></div>
                <p style={{ margin: "0", fontSize: "18px", color: "#4F5751" }}>
                  Credit depends on whoever runs the database.
                </p>
              </div>
              <div
                className="rv2"
                style={{
                  background: "#0B0D10",
                  color: "#F2F4F2",
                  borderRadius: "26px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 40px 90px rgba(18,21,26,.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "18px 26px",
                    borderBottom: "1px solid #262B32",
                  }}
                >
                  <img
                    src="/landing/tokens/mon.svg"
                    alt=""
                    style={{ width: "26px", height: "26px" }}
                  />
                  <span className="mono" style={{ fontSize: "17px" }}>
                    FORKBacking.sol
                  </span>
                  <div style={{ flex: 1 }}></div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#B1D6AC",
                      background: "#16261A",
                      padding: "5px 14px",
                      borderRadius: "999px",
                    }}
                  >
                    Immutable
                  </span>
                </div>
                <div
                  style={{
                    padding: "18px 22px",
                    background: "#0E1114",
                    borderBottom: "1px solid #262B32",
                    overflowX: "auto",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "18px", padding: "5px 0" }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "15px",
                        color: "#7C858C",
                        width: "28px",
                        textAlign: "right",
                      }}
                    >
                      39
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "15.5px",
                        color: "#A99BF0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      uint256 public constant{" "}
                      <span style={{ color: "#F2F4F2" }}>AUTHOR_SHARE_BPS</span>{" "}
                      <span style={{ color: "#858D88" }}>=</span>{" "}
                      <span style={{ color: "#FFE38F" }}>7_000</span>
                      <span style={{ color: "#858D88" }}>;</span>
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: "18px", padding: "5px 0" }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "15px",
                        color: "#7C858C",
                        width: "28px",
                        textAlign: "right",
                      }}
                    >
                      40
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "15.5px",
                        color: "#A99BF0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      uint256 public constant{" "}
                      <span style={{ color: "#F2F4F2" }}>PARENT_SHARE_BPS</span>{" "}
                      <span style={{ color: "#858D88" }}>=</span>{" "}
                      <span style={{ color: "#FFE38F" }}>2_000</span>
                      <span style={{ color: "#858D88" }}>;</span>
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: "18px", padding: "5px 0" }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "15px",
                        color: "#7C858C",
                        width: "28px",
                        textAlign: "right",
                      }}
                    >
                      41
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "15.5px",
                        color: "#A99BF0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      uint256 public constant{" "}
                      <span style={{ color: "#F2F4F2" }}>
                        GRANDPARENT_SHARE_BPS
                      </span>{" "}
                      <span style={{ color: "#858D88" }}>=</span>{" "}
                      <span style={{ color: "#FFE38F" }}>1_000</span>
                      <span style={{ color: "#858D88" }}>;</span>
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    padding: "22px 26px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#B1D6AC",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8.5 L 6.5 12 L 13 4.5"
                          fill="none"
                          stroke="#0B0D10"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </span>
                    <span style={{ fontSize: "16px" }}>
                      No owner, no admin, no upgrade path
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#B1D6AC",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8.5 L 6.5 12 L 13 4.5"
                          fill="none"
                          stroke="#0B0D10"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </span>
                    <span style={{ fontSize: "16px" }}>
                      Source verified on Sourcify
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#B1D6AC",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8.5 L 6.5 12 L 13 4.5"
                          fill="none"
                          stroke="#0B0D10"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </span>
                    <span style={{ fontSize: "16px" }}>
                      Every backing readable on the explorer and in Envio
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1 }}></div>
                <div
                  style={{
                    display: "flex",
                    padding: "14px 26px",
                    borderTop: "1px solid #262B32",
                    background: "#101318",
                  }}
                >
                  <span style={{ fontSize: "15px", color: "#A4ABA7", flex: 1 }}>
                    Deployed on Monad Testnet
                  </span>
                  <span className="mono" style={{ fontSize: "14px" }}>
                    0x832c…9f8f
                  </span>
                </div>
              </div>
            </div>
            <p
              className="rv"
              style={{
                margin: "56px 0 0",
                fontSize: "clamp(24px,2.4vw,34px)",
                fontWeight: 600,
                letterSpacing: "-.02em",
              }}
            >
              The same public record that names the author decides who is paid.
            </p>
          </div>
        </div>
      </section>
      <section style={{ padding: "40px 0" }}>
        <div
          id="monad"
          className="inset dots"
          style={{ padding: "110px 0", backgroundColor: "#0D0A1C" }}
        >
          <div
            className="glow"
            style={{
              right: "-300px",
              top: "-200px",
              width: "1100px",
              height: "1100px",
              background:
                "radial-gradient(circle,rgba(131,110,249,.30) 0%,rgba(131,110,249,.08) 40%,rgba(13,10,28,0) 68%)",
            }}
          ></div>
          <div className="wrap" style={{ position: "relative" }}>
            <div className="g2" style={{ alignItems: "stretch" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "40px",
                }}
              >
                <div className="rv">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <img
                      src="/landing/tokens/mon.svg"
                      alt=""
                      style={{ width: "30px", height: "30px" }}
                    />
                    <p
                      className="kick"
                      style={{ color: "#9B87FF", margin: "0" }}
                    >
                      Why Monad
                    </p>
                  </div>
                  <h2 className="h2b" style={{ marginTop: "14px" }}>
                    A backing has to feel like a like
                  </h2>
                  <p className="lead">
                    A backing is a social gesture that moves value. It has to
                    settle while the sheet is still open.
                  </p>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                    gap: "28px",
                  }}
                >
                  <div
                    className="rv"
                    style={{
                      borderTop: "1px solid #2C2452",
                      paddingTop: "22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: "clamp(48px,5vw,72px)",
                          letterSpacing: "-.05em",
                        }}
                        data-ticker
                      >
                        {ms(run.confirmMedianMs)}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: "22px", color: "#A4ABA7" }}
                      >
                        ms
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "4px",
                          background: "#9B87FF",
                          display: "inline-block",
                        }}
                      ></span>
                      <span style={{ fontSize: "17px" }}>To confirmation</span>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: "14px", color: "#858D88" }}
                    >
                      p95 {ms(run.confirmP95Ms)} ms
                    </span>
                  </div>
                  <div
                    className="rv"
                    style={{
                      borderTop: "1px solid #2C2452",
                      paddingTop: "22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: "clamp(48px,5vw,72px)",
                          letterSpacing: "-.05em",
                        }}
                        data-ticker
                      >
                        +{ms(run.indexMedianMs)}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: "22px", color: "#A4ABA7" }}
                      >
                        ms
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "4px",
                          background: "#9FD3FF",
                          display: "inline-block",
                        }}
                      ></span>
                      <span style={{ fontSize: "17px" }}>
                        Into everyone’s graph
                      </span>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: "14px", color: "#858D88" }}
                    >
                      p95 {ms(run.indexP95Ms)} ms
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="rv2"
                style={{
                  background: "#15112A",
                  border: "1px solid #2C2452",
                  borderRadius: "28px",
                  padding: "28px 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  boxShadow: "0 40px 100px rgba(0,0,0,.5)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "19px", fontWeight: 600 }}>
                    {run.samples} real backings
                  </span>
                  <div style={{ flex: 1 }}></div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "15px",
                      color: "#A4ABA7",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "5px",
                        background: "#9B87FF",
                        display: "inline-block",
                      }}
                    ></span>
                    Confirmed
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "15px",
                      color: "#A4ABA7",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "5px",
                        background: "#9FD3FF",
                        display: "inline-block",
                      }}
                    ></span>
                    In the graph
                  </span>
                </div>
                <div
                  className="g20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg,#2E2752 0,#2E2752 1px,transparent 1px,transparent 38.46%)",
                  }}
                >
                  {run.timings.map(([confirm, index], at) => (
                    <div
                      key={at}
                      className="gx"
                      style={{ display: "flex", gap: "2px", height: "14px" }}
                    >
                      <div
                        style={{
                          width: share(confirm),
                          background: "#9B87FF",
                          borderRadius: "4px 0 0 4px",
                        }}
                      ></div>
                      <div
                        style={{
                          width: share(index),
                          background: "#9FD3FF",
                          opacity: 0.85,
                          borderRadius: "0 4px 4px 0",
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex" }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      color: "#858D88",
                      width: "38.46%",
                    }}
                  >
                    0
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      color: "#858D88",
                      width: "38.46%",
                    }}
                  >
                    0.5 s
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: "13px", color: "#858D88" }}
                  >
                    1 s
                  </span>
                </div>
                <p style={{ margin: "0", fontSize: "14px", color: "#858D88" }}>
                  Monad Testnet, {recorded(run.recordedAt)}
                </p>
              </div>
            </div>
            <div className="g4" style={{ marginTop: "56px" }}>
              <div
                className="rv lift"
                style={{
                  background: "#15112A",
                  border: "1px solid #2C2452",
                  borderRadius: "22px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "#2A2160",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M13 2 L4 14 h7 l-1 8 9-12 h-7 z"
                        fill="none"
                        stroke="#9B87FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </span>
                  <span style={{ fontSize: "19px", fontWeight: 600 }}>
                    Fast finality
                  </span>
                </div>
                <p
                  style={{
                    margin: "0",
                    fontSize: "16px",
                    lineHeight: "1.5",
                    color: "#A4ABA7",
                  }}
                >
                  Backings settle before the sheet closes.
                </p>
              </div>
              <div
                className="rv lift"
                style={{
                  background: "#15112A",
                  border: "1px solid #2C2452",
                  borderRadius: "22px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "#2A2160",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 6 h16 M4 12 h16 M4 18 h16"
                        fill="none"
                        stroke="#9B87FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </span>
                  <span style={{ fontSize: "19px", fontWeight: 600 }}>
                    Parallel execution
                  </span>
                </div>
                <p
                  style={{
                    margin: "0",
                    fontSize: "16px",
                    lineHeight: "1.5",
                    color: "#A4ABA7",
                  }}
                >
                  Many small backings, each split onchain.
                </p>
              </div>
              <div
                className="rv lift"
                style={{
                  background: "#15112A",
                  border: "1px solid #2C2452",
                  borderRadius: "22px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "#2A2160",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 6 L2 12 L8 18 M16 6 L22 12 L16 18"
                        fill="none"
                        stroke="#9B87FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </span>
                  <span style={{ fontSize: "19px", fontWeight: 600 }}>
                    Full EVM
                  </span>
                </div>
                <p
                  style={{
                    margin: "0",
                    fontSize: "16px",
                    lineHeight: "1.5",
                    color: "#A4ABA7",
                  }}
                >
                  Plain Solidity and Foundry, verified on Sourcify.
                </p>
              </div>
              <div
                className="rv lift"
                style={{
                  background: "#15112A",
                  border: "1px solid #2C2452",
                  borderRadius: "22px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "#2A2160",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M14 7 a4 4 0 1 0 3 3 l4 4 -3 3 -4 -4 a4 4 0 0 1 -3 -3"
                        fill="none"
                        stroke="#9B87FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </span>
                  <span style={{ fontSize: "19px", fontWeight: 600 }}>
                    Ethereum tooling
                  </span>
                </div>
                <p
                  style={{
                    margin: "0",
                    fontSize: "16px",
                    lineHeight: "1.5",
                    color: "#A4ABA7",
                  }}
                >
                  Privy wallets and Envio indexing, unchanged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="sec dots" style={{ overflow: "hidden" }}>
        <div
          className="glow"
          style={{
            right: "-260px",
            top: "-80px",
            width: "1000px",
            height: "1000px",
            background:
              "radial-gradient(circle,rgba(131,110,249,.26) 0%,rgba(131,110,249,.07) 38%,rgba(11,13,16,0) 66%)",
          }}
        ></div>
        <div className="wrap" style={{ position: "relative" }}>
          <div
            className="rv"
            style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
          >
            <img
              className="av"
              src="/landing/avatars/mira.svg"
              alt="mira"
              style={{ width: "72px", height: "72px" }}
            />
            <img
              className="av"
              src="/landing/avatars/theo.svg"
              alt="theo"
              style={{ width: "72px", height: "72px" }}
            />
            <img
              className="av"
              src="/landing/avatars/lena.svg"
              alt="lena"
              style={{ width: "72px", height: "72px" }}
            />
            <img
              className="av"
              src="/landing/avatars/kaan.svg"
              alt="kaan"
              style={{ width: "72px", height: "72px" }}
            />
            <img
              className="av"
              src="/landing/avatars/deniz.svg"
              alt="deniz"
              style={{ width: "72px", height: "72px" }}
            />
            <img
              className="av"
              src="/landing/avatars/umut.svg"
              alt="umut"
              style={{ width: "72px", height: "72px" }}
            />
            <img
              className="av"
              src="/landing/avatars/ada.svg"
              alt="ada"
              style={{ width: "72px", height: "72px" }}
            />
            <img
              className="av"
              src="/landing/avatars/emre.svg"
              alt="emre"
              style={{ width: "72px", height: "72px" }}
            />
          </div>
          <h2
            className="rv"
            style={{
              margin: "44px 0 0",
              fontSize: "clamp(56px,9vw,148px)",
              lineHeight: "1.0",
              letterSpacing: "-.055em",
              fontWeight: 600,
            }}
          >
            Good ideas deserve
            <br />
            <span className="grad flow">a history.</span>
          </h2>
          <div
            className="rv2"
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "48px",
              flexWrap: "wrap",
            }}
          >
            <Link className="btn pri" href="/feed" prefetch={false}>
              Open FORK <span aria-hidden="true">→</span>
            </Link>
            <a className="btn sec2" href="#how">
              See how it works
            </a>
          </div>
        </div>
      </section>
      <footer
        style={{
          borderTop: "1px solid #1C2026",
          padding: "56px 0 40px",
          background: "#0B0D10",
        }}
      >
        <div className="wrap">
          <p className="wm" aria-label="FORK">
            FORK
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              flexWrap: "wrap",
              marginTop: "40px",
              borderTop: "1px solid #1C2026",
              paddingTop: "28px",
            }}
          >
            <Link
              href="/feed"
              prefetch={false}
              style={{ color: "#A4ABA7", fontSize: "15px" }}
            >
              Open FORK
            </Link>
            <a
              href="https://github.com/anilkaracay/fork-metropolis"
              style={{ color: "#A4ABA7", fontSize: "15px" }}
            >
              GitHub
            </a>
            <a
              href="https://testnet.monadvision.com/address/0x832ca98b0dbd94caa0f3d3e06ea658284cc39f8f"
              style={{ color: "#A4ABA7", fontSize: "15px" }}
            >
              FORKBacking
            </a>
            <span
              className="mono"
              style={{ fontSize: "13px", color: "#858D88" }}
            >
              0x832c…9f8f
            </span>
            <div style={{ flex: 1 }}></div>
            <span style={{ fontSize: "14px", color: "#858D88" }}>Built by</span>
            <img
              src="/landing/logos/cayvox.png"
              alt="Cayvox"
              style={{ height: "26px", width: "auto" }}
            />
          </div>
          <p style={{ margin: "24px 0 0", fontSize: "13px", color: "#858D88" }}>
            FORK runs on Monad Testnet. Testnet MON has no monetary value, and
            ideas are opinions, not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
