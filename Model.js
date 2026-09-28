.pragma library

var EMPTY = { today_cost: null, today_tokens: null, today_sessions: 0, sessions: [], history_days: [], history_months: [] }

// Parse one line of `scripts/ocmetrics`. Always returns a well-formed
// reading, so one bad line never blanks the bar.
function parse(line) {
  try {
    var doc = JSON.parse(line)
    return {
      today_cost: numberOrNull(doc.today_cost),
      today_tokens: intOrNull(doc.today_tokens),
      today_sessions: (typeof doc.today_sessions === "number" && isFinite(doc.today_sessions))
        ? Math.max(0, Math.floor(doc.today_sessions)) : 0,
      sessions: sanitizeSessions(doc.sessions),
      history_days: sanitizeHistory(doc.history_days, 30),
      history_months: sanitizeHistory(doc.history_months, 12)
    }
  } catch (e) {
    return EMPTY
  }
}

function sanitizeHistory(list, maxItems) {
  if (!Array.isArray(list)) return []
  var out = []
  for (var i = 0; i < list.length && out.length < maxItems; i++) {
    var h = list[i]
    if (!h || typeof h !== "object") continue
    var period = plainString(h.period, 10)
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(period)) continue
    out.push({
      period: period,
      cost: (typeof h.cost === "number" && isFinite(h.cost)) ? h.cost : 0,
      tokens: (typeof h.tokens === "number" && isFinite(h.tokens)) ? Math.max(0, Math.floor(h.tokens)) : 0,
      sessions: (typeof h.sessions === "number" && isFinite(h.sessions)) ? Math.max(0, Math.floor(h.sessions)) : 0
    })
  }
  return out
}

function sanitizeSessions(list) {
  if (!Array.isArray(list)) return []
  var out = []
  for (var i = 0; i < list.length && out.length < 10; i++) {
    var s = list[i]
    if (!s || typeof s !== "object") continue
    out.push({
      title: plainString(s.title, 64) || "Untitled session",
      model: plainString(s.model, 32),
      cost: (typeof s.cost === "number" && isFinite(s.cost)) ? s.cost : 0,
      tokens: (typeof s.tokens === "number" && isFinite(s.tokens)) ? Math.max(0, Math.floor(s.tokens)) : 0,
      updated: (typeof s.updated === "number" && isFinite(s.updated)) ? Math.floor(s.updated) : 0
    })
  }
  return out
}

function plainString(value, maxLen) {
  if (typeof value !== "string") return ""
  return value
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/[<>&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen || 64)
}

function truthy(value) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    var v = value.trim().toLowerCase()
    return !(v === "" || v === "false" || v === "0" || v === "no" || v === "off")
  }
  return !!value
}

function numberOrNull(value) {
  return (typeof value === "number" && isFinite(value)) ? value : null
}

function intOrNull(value) {
  return (typeof value === "number" && isFinite(value)) ? Math.max(0, Math.floor(value)) : null
}

function hasReading(reading) {
  if (!reading) return false
  return reading.today_cost !== null || reading.today_tokens !== null
    || reading.sessions.length > 0
}

// 496730 -> "497k", 1500 -> "1.5k", 999 -> "999", 2500000 -> "2.5M"
function formatTokens(n) {
  if (n === null || n === undefined) return "n/a"
  if (n < 1000) return String(n)
  if (n < 1000000) {
    var k = n / 1000
    return (k >= 100 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, "")) + "k"
  }
  var m = n / 1000000
  return (m >= 100 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, "")) + "M"
}

function formatCost(c) {
  if (c === null || c === undefined) return "n/a"
  if (c === 0) return "$0"
  if (c < 0.01) return "$" + c.toFixed(4)
  if (c < 10) return "$" + c.toFixed(2)
  return "$" + c.toFixed(1)
}

function formatTime(epochSec) {
  if (!epochSec) return ""
  var d = new Date(epochSec * 1000)
  var h = d.getHours()
  var m = d.getMinutes()
  return (h < 10 ? "0" + h : "" + h) + ":" + (m < 10 ? "0" + m : "" + m)
}

// Compact bar read-out, e.g. "OC $0 · 497k" or "OC 3 sess · 1.2M".
function barText(reading, show) {
  if (!reading) return "OC n/a"
  var parts = []
  if (show.cost && reading.today_cost !== null)
    parts.push(formatCost(reading.today_cost))
  if (show.tokens && reading.today_tokens !== null)
    parts.push(formatTokens(reading.today_tokens))
  if (parts.length === 0) {
    if (reading.today_sessions > 0)
      return "OC " + reading.today_sessions + " sess"
    return "OC n/a"
  }
  return "OC " + parts.join(" · ")
}

function rows(reading) {
  if (!reading) return []
  var out = []
  out.push({
    label: "Today",
    value: formatCost(reading.today_cost) + " · " + formatTokens(reading.today_tokens)
      + " · " + reading.today_sessions + " sess",
    dim: false
  })
  for (var i = 0; i < reading.sessions.length; i++) {
    var s = reading.sessions[i]
    var sub = (s.model ? s.model + " · " : "") + formatTokens(s.tokens)
      + " · " + formatCost(s.cost)
    var when = formatTime(s.updated)
    out.push({
      label: s.title + (when ? "  (" + when + ")" : ""),
      value: sub,
      dim: false
    })
  }
  return out
}

function tooltip(reading) {
  var list = rows(reading)
  if (list.length === 0) return "No OpenCode sessions today"
  var lines = []
  for (var i = 0; i < list.length; i++)
    lines.push(list[i].label + ": " + list[i].value)
  return lines.join("\n")
}

var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// "2026-09-28" -> "Mon 28", "2026-09" -> "Sep 2026"
function formatDay(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (isNaN(d.getTime())) return iso
  return WEEKDAYS[d.getDay()] + " " + Number(m[3])
}

function formatMonth(iso) {
  var m = /^(\d{4})-(\d{2})$/.exec(iso)
  if (!m) return iso
  return MONTHS[Number(m[2]) - 1] + " " + m[1]
}

// Last-14-days rows for the bar chart, oldest first, each with frac 0..1
// relative to the busiest day so bars scale.
function historyDayRows(reading) {
  if (!reading || !reading.history_days || reading.history_days.length === 0) return []
  var days = reading.history_days.slice(0, 14).reverse()
  var max = 0
  for (var i = 0; i < days.length; i++)
    if (days[i].tokens > max) max = days[i].tokens
  if (max <= 0) max = 1
  var out = []
  for (var j = 0; j < days.length; j++) {
    out.push({
      label: formatDay(days[j].period),
      value: formatTokens(days[j].tokens) + " · " + formatCost(days[j].cost)
        + " · " + days[j].sessions + " sess",
      frac: days[j].tokens / max
    })
  }
  return out
}

function historyMonthRows(reading) {
  if (!reading || !reading.history_months || reading.history_months.length === 0) return []
  var out = []
  for (var i = 0; i < reading.history_months.length; i++) {
    var h = reading.history_months[i]
    out.push({
      label: formatMonth(h.period),
      value: formatTokens(h.tokens) + " · " + formatCost(h.cost)
        + " · " + h.sessions + " sess",
      dim: false
    })
  }
  return out
}
