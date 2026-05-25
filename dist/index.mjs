import React3, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Eye, Trash2, ChevronUp, ChevronDown, Undo2, Info, ChevronRight, GripVertical, Ungroup, Check, X, FoldVertical } from 'lucide-react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { createPortal } from 'react-dom';

// src/renta/index.tsx

// src/common/styles.ts
var T = {
  // ── Base ──
  table: "w-full text-xs border-separate border-spacing-0",
  // ── Header: accordion bar (TableShell) ──
  headerAccordion: "px-4 py-2.5",
  headerAccordionStat: "px-2 py-2.5 text-right whitespace-nowrap",
  headerTitle: "font-normal text-xs truncate",
  headerStat: "font-normal text-xs",
  headerStatLabel: "font-normal text-xs",
  // ── Header: column headers (th) ──
  th: "text-ink-tertiary font-medium text-xs uppercase",
  headerCell: "px-2 py-1.5 whitespace-nowrap",
  /** Vertical divider between columns */
  vline: "border-r border-edge-subtle/10",
  /** Legacy action-column placeholder. The hover toolbar overlays the row's
   * left edge instead of occupying a dedicated column, so this width is now
   * 0 — the placeholder `<td>` cells stay only to preserve column counts
   * across header/body/footer in tables that still emit them (renta).
   */
  actionCol: "w-0 p-0",
  /** Compact cell padding for small icon/badge columns (80px min) */
  cellCompact: "px-0.5 py-1 whitespace-nowrap",
  // ── Body: read-only cells (compact) ──
  cell: "py-1.5 px-3 whitespace-nowrap",
  cellValue: "py-1.5 px-3 text-right tabular-nums whitespace-nowrap",
  cellLabel: "overflow-hidden",
  // ── Body: editable cells (taller click targets) ──
  cellEdit: "px-2 py-1.5 whitespace-nowrap",
  cellEditLabel: "pl-1 pr-2 py-1.5 whitespace-nowrap",
  // ── Totals / footer ──
  totalCell: "px-2 py-1.5 whitespace-nowrap",
  totalLabel: "font-medium text-xs",
  totalValue: "font-medium text-xs",
  footerLabel: "font-bold",
  footerValue: "font-bold",
  // ── Inputs (transparent inline) ──
  input: "bg-transparent border-none outline-none text-xs truncate text-ink-primary placeholder-ink-tertiary/35",
  inputLabel: "bg-transparent border-none outline-none text-xs font-medium truncate text-ink-primary placeholder-ink-tertiary/35",
  inputPlaceholder: "bg-transparent border-none outline-none text-xs text-ink-secondary placeholder-ink-tertiary/35 truncate",
  rowLabel: "bg-transparent border-none outline-none text-xs font-medium text-ink-primary truncate",
  /** Data row indent (child rows below subheaders) */
  cellIndent: "pl-6",
  muted: "text-xs text-ink-secondary",
  empty: "text-xs text-ink-tertiary/60 italic",
  cardLabel: "text-xs font-medium",
  cardValue: "text-xs font-semibold",
  // ── Row classes ──
  row: "border-b border-edge-subtle/10",
  rowBorder: "border-b border-edge-subtle/10",
  rowHover: "hover:bg-surface-1/60",
  rowTotal: "border-b bg-surface-1/80 border-edge-subtle/20"};

// src/common/colors.ts
var DEFAULT_SCHEME = {
  bg: "bg-surface-2",
  text: "text-ink-secondary",
  border: "border-edge-subtle/20"
};
function resolveColors(colorScheme, headerBg, headerText, defaultScheme = DEFAULT_SCHEME) {
  if (colorScheme) return colorScheme;
  if (headerBg || headerText) {
    const bg = headerBg || defaultScheme.bg;
    const text = headerText || defaultScheme.text;
    const legacy = /-(50|100)$/.test(bg);
    const border = legacy ? bg.replace("bg-", "border-").replace(/-(50|100)$/, "-200") : defaultScheme.border;
    return { bg, text, border };
  }
  return defaultScheme;
}
var SourceIcon = ({
  fileIds,
  onViewSource,
  className
}) => {
  if (!onViewSource) return null;
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: (e) => {
        e.stopPropagation();
        onViewSource(fileIds || []);
      },
      className: "p-1 rounded hover:bg-surface-2/60 transition-all opacity-0 group-hover/header:opacity-100 cursor-pointer",
      title: "Ver documento fuente",
      children: /* @__PURE__ */ jsx(Eye, { size: 14, className })
    }
  );
};
var TableShell = ({
  colorScheme: colorSchemeProp,
  headerBg: headerBgProp = "bg-surface-2",
  headerClassName,
  className,
  rowCount,
  renderHeader,
  children,
  renderFooter,
  renderAfterContent
}) => {
  const { bg: headerBg, text: headerText } = resolveColors(colorSchemeProp, headerBgProp);
  return /* @__PURE__ */ jsxs("div", { className: `border-t border-edge-subtle/20 mb-4 sm:mb-6 ${className || ""}`, children: [
    /* @__PURE__ */ jsxs("table", { className: T.table, children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: `${headerBg} ${headerText} ${headerClassName || ""} group/header`, children: renderHeader() }) }),
      /* @__PURE__ */ jsx("tbody", { className: "text-ink-secondary", children }),
      renderFooter && rowCount !== 0 && /* @__PURE__ */ jsx("tfoot", { children: renderFooter() })
    ] }),
    renderAfterContent?.()
  ] });
};
var tableshell_default = TableShell;

// src/common/utils.ts
var generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
var formatDeletedDate = (iso) => {
  const d = new Date(iso);
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 6e4);
  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `hace ${diffDays}d`;
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
};
var MONTH_LABELS = {
  enero: "Enero",
  febrero: "Febrero",
  marzo: "Marzo",
  abril: "Abril",
  mayo: "Mayo",
  junio: "Junio",
  julio: "Julio",
  agosto: "Agosto",
  septiembre: "Septiembre",
  octubre: "Octubre",
  noviembre: "Noviembre",
  diciembre: "Diciembre"
};
var displayCurrency = (value) => {
  if (value === void 0 || value === null) return "";
  return `$ ${value.toLocaleString("es-CL")}`;
};
var defaultFormatCurrency = (value) => {
  if (value === void 0 || value === null) return "\u2014";
  return `$ ${value.toLocaleString("es-CL")}`;
};
var displayCurrencyCompact = (value, isDeduction = false) => {
  if (value === void 0 || value === null) return "\u2014";
  const abs = Math.abs(value);
  const sign = isDeduction && value > 0 || value < 0 ? "-" : "";
  const thousands = Math.round(abs / 1e3);
  return `${sign}$${thousands.toLocaleString("es-CL")}`;
};

// src/renta/helpers.ts
var MONTH_NAMES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
var generateLastNMonths = (count) => {
  const months = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = MONTH_NAMES[d.getMonth() + 1];
    months.push({ id, label });
  }
  return months;
};
var defaultFormatValue = (value) => {
  return displayCurrencyCompact(value);
};
var isAddType = (type) => type === "add" || type === "income";
var isSubtractType = (type) => type === "subtract" || type === "deduction" || type === "debt";
var rowMatchesSection = (row, sectionType) => {
  if (row.type === sectionType) return true;
  if (sectionType === "add" && row.type === "income") return true;
  if (sectionType === "income" && row.type === "add") return true;
  if (sectionType === "subtract" && (row.type === "deduction" || row.type === "debt")) return true;
  return false;
};
var defaultCalculateTotal = (monthId, rows) => {
  let total = 0;
  for (const row of rows) {
    if (row.isGroup || row.deletedAt) continue;
    const value = row.values[monthId];
    if (value !== null && value !== void 0) {
      if (isAddType(row.type)) {
        total += value;
      } else {
        total -= value;
      }
    }
  }
  return total;
};
var getOrderedItems = (rows, sectionType) => {
  const sectionRows = rows.filter((r) => rowMatchesSection(r, sectionType) && !r.deletedAt);
  const groups = sectionRows.filter((r) => r.isGroup);
  const groupedChildren = sectionRows.filter((r) => r.groupId && !r.isGroup);
  const ungrouped = sectionRows.filter((r) => !r.isGroup && !r.groupId);
  const items = [];
  for (const group of groups) {
    const children = groupedChildren.filter((r) => r.groupId === group.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    items.push({ kind: "group", group, children, sortKey: group.order ?? 0 });
  }
  for (const row of ungrouped) {
    items.push({ kind: "row", row, sortKey: row.order ?? 0 });
  }
  items.sort((a, b) => a.sortKey - b.sortKey);
  return items;
};
var computeSectionSubtotal = (rows, sectionType, months) => {
  const sectionRows = rows.filter((r) => rowMatchesSection(r, sectionType) && !r.isGroup && !r.deletedAt);
  const result = {};
  for (const month of months) {
    let sum = 0;
    for (const row of sectionRows) {
      sum += row.values[month.id] ?? 0;
    }
    result[month.id] = sum;
  }
  return result;
};
var computeRentaVariable = (rows, months) => {
  const result = {};
  for (const month of months) {
    let sum = 0;
    for (const row of rows) {
      if (row.isGroup || row.deletedAt || !row.isVariable) continue;
      if (row.naturaleza === "Legal") continue;
      const value = row.values[month.id] ?? 0;
      if (isAddType(row.type)) sum += value;
      else sum -= value;
    }
    result[month.id] = sum;
  }
  return result;
};
var computeGroupValues = (children, months) => {
  const result = {};
  for (const month of months) {
    let sum = 0;
    for (const child of children) {
      sum += child.values[month.id] ?? 0;
    }
    result[month.id] = sum;
  }
  return result;
};
var createGroup = (rows, selectedIds, groupName) => {
  const selected = rows.filter((r) => selectedIds.has(r.id));
  if (selected.length < 2) return rows;
  const groupType = selected[0].type;
  const groupId = `group_${Date.now()}`;
  const firstIdx = rows.findIndex((r) => selectedIds.has(r.id));
  const newRows = rows.map((r, idx) => {
    if (selectedIds.has(r.id)) {
      return { ...r, groupId, order: idx };
    }
    return { ...r, order: idx };
  });
  const groupHeader = {
    id: groupId,
    label: groupName,
    type: groupType,
    values: {},
    isGroup: true,
    collapsed: true,
    order: firstIdx
  };
  newRows.splice(firstIdx, 0, groupHeader);
  return autoUngroup(newRows);
};
var ungroupRows = (rows, groupId) => {
  return rows.filter((r) => r.id !== groupId).map((r) => {
    if (r.groupId === groupId) {
      const { groupId: _, ...rest } = r;
      return rest;
    }
    return r;
  });
};
var autoUngroup = (rows) => {
  const groups = rows.filter((r) => r.isGroup && !r.deletedAt);
  let result = rows;
  for (const group of groups) {
    const children = result.filter((r) => r.groupId === group.id && !r.deletedAt);
    if (children.length < 2) {
      result = ungroupRows(result, group.id);
    }
  }
  return result;
};
var softDeleteRows = (rows, ids, reason) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let result = rows.map((r) => {
    if (!ids.has(r.id)) return r;
    return { ...r, deletedAt: now, deletionReason: reason || void 0 };
  });
  return autoUngroup(result);
};
var restoreRows = (rows, ids) => {
  return rows.map((r) => {
    if (!ids.has(r.id)) return r;
    const { deletedAt: _, deletionReason: __, ...rest } = r;
    return rest;
  });
};
var useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
};
var parseCurrency = (value) => {
  const cleaned = value.replace(/[^0-9-]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
};
var EditableCell = ({
  value,
  onChange,
  type = "currency",
  isDeduction = false,
  hasData = true,
  className = "",
  align = "right",
  placeholder = "",
  onViewSource,
  asDiv = false,
  focused = false,
  onCellFocus,
  onNavigate,
  requestEdit = 0,
  requestClear = 0,
  editInitialValue,
  originClass,
  keyboard,
  rowId,
  cellKey
}) => {
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const committingRef = useRef(false);
  const useRegistry = !!(keyboard && rowId && cellKey);
  const register = keyboard?.register;
  useEffect(() => {
    if (!useRegistry || !register) return;
    return register({ rowId, cellKey, ref: wrapperRef });
  }, [useRegistry, register, rowId, cellKey]);
  const cellFocused = useRegistry ? keyboard.isFocused(rowId, cellKey) : focused;
  const editRequest = useRegistry ? keyboard.editRequest : null;
  const clearRequest = useRegistry ? keyboard.clearRequest : null;
  const editRequestForMe = useRegistry && editRequest && editRequest.rowId === rowId && editRequest.cellKey === cellKey ? editRequest : null;
  const clearRequestForMe = useRegistry && clearRequest && clearRequest.rowId === rowId && clearRequest.cellKey === cellKey ? clearRequest : null;
  const startEdit = (initialValue) => {
    committingRef.current = false;
    setEditValue(initialValue ?? value?.toString() ?? "");
    setIsEditing(true);
  };
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (editValue.length <= 1) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      } else {
        inputRef.current.select();
      }
    }
  }, [isEditing]);
  const commitEdit = () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const inputStillFocused = document.activeElement === inputRef.current;
    setIsEditing(false);
    let newValue = editValue;
    if (type === "number") {
      newValue = editValue === "" ? null : parseInt(editValue, 10);
      if (typeof newValue === "number" && isNaN(newValue)) newValue = null;
    } else if (type === "currency") {
      newValue = parseCurrency(editValue);
    } else if (type === "percent") {
      newValue = editValue === "" ? null : parseFloat(editValue);
      if (typeof newValue === "number" && isNaN(newValue)) newValue = null;
    } else {
      newValue = editValue === "" ? null : editValue;
    }
    if (newValue != value) {
      onChange(newValue);
    }
    if (useRegistry && inputStillFocused) {
      wrapperRef.current?.focus();
    }
  };
  const cancelEdit = () => {
    committingRef.current = true;
    setIsEditing(false);
    setEditValue("");
  };
  const goNavigate = (direction) => {
    if (useRegistry) keyboard.navigate(direction);
    else onNavigate?.(direction);
  };
  const hasNavTarget = useRegistry || !!onNavigate;
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
      goNavigate("down");
    } else if (e.key === "Tab") {
      if (hasNavTarget) {
        e.preventDefault();
        commitEdit();
        goNavigate(e.shiftKey ? "left" : "right");
      }
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };
  const getDisplayValue = () => {
    if (type === "currency") {
      return displayCurrencyCompact(value, isDeduction);
    }
    if (type === "percent") {
      if (value === null || value === void 0) return "\u2014";
      return `${value}%`;
    }
    return value?.toString() || "\u2014";
  };
  const displayValue = getDisplayValue();
  const colorClass = !hasData ? "text-ink-tertiary/60" : isDeduction && type === "currency" ? "text-status-pending" : originClass || "text-ink-primary";
  const alignClass = align === "left" ? "text-left justify-start" : align === "center" ? "text-center justify-center" : "text-right justify-end";
  const inputAlignClass = align === "left" ? "text-left" : align === "center" ? "text-center" : "text-right";
  const Wrapper = asDiv ? "div" : "td";
  useEffect(() => {
    if (useRegistry) {
      if (editRequestForMe && !isEditing) {
        startEdit(editRequestForMe.initialValue ?? void 0);
      }
      return;
    }
    if (requestEdit > 0 && !isEditing) {
      startEdit(editInitialValue ?? void 0);
    }
  }, [useRegistry ? editRequestForMe?.n : requestEdit]);
  useEffect(() => {
    if (useRegistry) {
      if (clearRequestForMe) onChange(null);
      return;
    }
    if (requestClear > 0) onChange(null);
  }, [useRegistry ? clearRequestForMe?.n : requestClear]);
  const handleClick = () => {
    if (!isEditing) {
      if (useRegistry) keyboard.focus(rowId, cellKey);
      else onCellFocus?.();
    }
  };
  const handleDoubleClick = () => {
    if (!isEditing) {
      if (useRegistry) keyboard.focus(rowId, cellKey);
      else onCellFocus?.();
      startEdit();
    }
  };
  const focusRing = cellFocused && !isEditing ? "ring-2 ring-brand ring-inset" : "";
  return /* @__PURE__ */ jsx(
    Wrapper,
    {
      ref: useRegistry ? wrapperRef : void 0,
      tabIndex: useRegistry ? 0 : void 0,
      className: `${T.cellEdit} cursor-pointer ${focusRing} ${useRegistry ? "outline-none" : ""} ${className}`,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onFocus: useRegistry ? () => keyboard.focus(rowId, cellKey) : void 0,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      children: /* @__PURE__ */ jsxs("div", { className: `h-5 flex items-center ${alignClass} gap-1 relative`, children: [
        isEditing && /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "text",
            inputMode: type === "currency" || type === "number" ? "numeric" : void 0,
            value: editValue,
            onChange: (e) => setEditValue(e.target.value),
            onBlur: commitEdit,
            onKeyDown: handleKeyDown,
            className: `absolute inset-0 ${inputAlignClass} ${colorClass} text-xs tabular-nums bg-transparent border-none outline-none ring-0 shadow-none p-0 z-10`,
            autoComplete: "off"
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: `text-xs tabular-nums ${colorClass} ${!hasData ? "text-ink-tertiary/60" : ""} ${isEditing ? "invisible" : ""}`,
            title: type === "currency" && hasData ? displayCurrency(value) : void 0,
            children: displayValue
          }
        ),
        onViewSource && (isMobile || isHovered) && !isEditing && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              onViewSource();
            },
            className: `p-0.5 rounded hover:bg-surface-2 transition-all shrink-0 ${isMobile ? "opacity-100" : ""}`,
            title: "Ver documento fuente",
            children: /* @__PURE__ */ jsx(Eye, { size: 14, className: "text-ink-tertiary" })
          }
        )
      ] })
    }
  );
};
var editablecell_default = EditableCell;
var GridTextInput = ({
  keyboard,
  rowId,
  cellKey,
  value,
  onChange,
  placeholder,
  className,
  style,
  title,
  onEnter
}) => {
  const ref = useRef(null);
  const { register, focus, navigate } = keyboard;
  useEffect(() => {
    return register({
      rowId,
      cellKey,
      ref
    });
  }, [register, rowId, cellKey]);
  return /* @__PURE__ */ jsx(
    "input",
    {
      ref,
      type: "text",
      value,
      onChange: (e) => onChange(e.target.value),
      placeholder,
      className,
      style,
      title,
      onFocus: () => focus(rowId, cellKey),
      onKeyDown: (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          navigate(e.shiftKey ? "left" : "right");
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (onEnter) onEnter();
          else e.target.blur();
        }
      },
      autoComplete: "off"
    }
  );
};
var gridtextinput_default = GridTextInput;
var RowToolbar = ({
  hovered,
  anySelected = false,
  selected = false,
  reorderable = false,
  onDragStart,
  onDragEnd,
  selectable = false,
  onToggleSelect,
  onDelete,
  sourceFileId,
  onViewSource
}) => {
  const reveal = hovered || anySelected;
  const transform = reveal ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full opacity-0 pointer-events-none";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5 px-1 py-0.5 rounded-r bg-surface-1/85 backdrop-blur-sm shadow-sm transition-[transform,opacity] duration-150 ease-out ${transform} group-focus-within:translate-x-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto`,
      onClick: (e) => e.stopPropagation(),
      onMouseDown: (e) => e.stopPropagation(),
      children: [
        reorderable && onDragStart && /* @__PURE__ */ jsx(
          "span",
          {
            draggable: hovered,
            onDragStart,
            onDragEnd,
            className: "cursor-grab active:cursor-grabbing text-ink-tertiary/70 hover:text-ink-secondary p-0.5 rounded",
            title: "Arrastrar para reordenar",
            children: /* @__PURE__ */ jsx(GripVertical, { size: 14 })
          }
        ),
        selectable && onToggleSelect && /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: selected,
            onChange: onToggleSelect,
            className: "w-3.5 h-3.5 rounded border-edge-subtle/30 text-status-ok focus:ring-status-ok cursor-pointer",
            title: "Seleccionar fila"
          }
        ),
        onDelete && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onDelete,
            className: "p-0.5 rounded text-status-pending/70 hover:text-status-pending hover:bg-status-pending/10",
            title: "Eliminar fila",
            children: /* @__PURE__ */ jsx(X, { size: 14 })
          }
        ),
        sourceFileId && onViewSource && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onViewSource([sourceFileId]),
            className: "p-0.5 rounded text-ink-tertiary hover:text-ink-primary hover:bg-surface-2",
            title: "Ver documento fuente",
            children: /* @__PURE__ */ jsx(Eye, { size: 14 })
          }
        )
      ]
    }
  );
};
var rowtoolbar_default = RowToolbar;
var LABEL_CELL_KEY = "__label__";
var naturalezaPill = (n) => {
  switch (n) {
    case "Imponible":
      return { label: "IMP", style: "bg-status-info/10 text-status-info border border-status-info/30" };
    case "No imponible":
      return { label: "NO IMP", style: "bg-surface-1 text-ink-tertiary border border-edge-subtle/20" };
    case "Legal":
      return { label: "LEGAL", style: "bg-status-ok/10 text-status-ok border border-status-ok/30" };
    case "Otro":
      return { label: "OTRO", style: "bg-surface-1 text-ink-tertiary border border-edge-subtle/20" };
    default:
      return { label: "\u2014", style: "bg-surface-1 text-ink-tertiary/60 border border-edge-subtle/10" };
  }
};
var rentaPill = (isVariable, naturaleza) => {
  if (naturaleza === "Legal") return { label: "\u2014", style: "bg-surface-1 text-ink-tertiary/60 border border-edge-subtle/10" };
  return isVariable ? { label: "RV", style: "bg-status-warn/10 text-status-warn border border-status-warn/30" } : { label: "RF", style: "bg-status-info/10 text-status-info border border-status-info/30" };
};
var PILL = "rounded-sm py-0.5 text-[9px] font-semibold cursor-pointer select-none transition-opacity hover:opacity-70 block leading-tight whitespace-nowrap text-center mx-auto px-1.5";
var DataRow = ({
  row,
  months,
  isHovered,
  selected = false,
  anySelected = false,
  selectable = false,
  hoverProps,
  onRemove,
  onToggleSelect,
  onContextMenu,
  onLabelChange,
  onValueChange,
  onViewSource,
  keyboard,
  showVariableColumn = false,
  onToggleVariable,
  showClassificationColumns = false,
  onToggleNaturaleza,
  isDragging = false,
  dropIndicator,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  getCellOriginClass
}) => {
  const indented = !!row.groupId;
  const subtract = isSubtractType(row.type);
  const rowBg = selected ? "bg-status-ok/10" : row.isVariable ? subtract ? "bg-status-warn/10 hover:bg-status-warn/20" : "bg-status-warn/5 hover:bg-status-warn/15" : subtract ? "bg-status-pending/10 hover:bg-status-pending/15" : "hover:bg-surface-1/60";
  const dropBorder = dropIndicator === "above" ? "border-t-2 border-t-brand" : dropIndicator === "below" ? "border-b-2 border-b-brand" : "";
  const handleRowClick = (e) => {
    if (!selectable || !onToggleSelect) return;
    if (!(e.metaKey || e.ctrlKey)) return;
    const target = e.target;
    if (target.closest('input, button, [role="button"]')) return;
    e.preventDefault();
    onToggleSelect();
  };
  return /* @__PURE__ */ jsxs(
    "tr",
    {
      className: `border-b border-edge-subtle/10 ${rowBg} ${isDragging ? "opacity-40" : ""} ${dropBorder} group`,
      onClick: handleRowClick,
      ...hoverProps,
      onContextMenu,
      onDragOver,
      onDragLeave,
      onDrop,
      children: [
        /* @__PURE__ */ jsxs("td", { className: `${T.cellEditLabel} text-ink-secondary ${T.cellLabel} relative ${showClassificationColumns ? "" : T.vline}`, children: [
          /* @__PURE__ */ jsx(
            rowtoolbar_default,
            {
              hovered: isHovered,
              anySelected,
              selected,
              reorderable: !!onDragStart,
              onDragStart,
              onDragEnd,
              selectable,
              onToggleSelect,
              onDelete: onRemove
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-0.5 min-w-0 ${indented ? "pl-4" : ""}`, children: [
            keyboard ? /* @__PURE__ */ jsx(
              gridtextinput_default,
              {
                keyboard,
                rowId: row.id,
                cellKey: LABEL_CELL_KEY,
                value: row.label,
                onChange: onLabelChange,
                className: `flex-1 min-w-0 ${T.rowLabel}`,
                title: row.label
              }
            ) : /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: row.label,
                onChange: (e) => onLabelChange(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") e.target.blur();
                },
                className: `flex-1 min-w-0 ${T.rowLabel}`,
                title: row.label
              }
            ),
            row.sourceFileId && onViewSource && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onViewSource([row.sourceFileId]),
                className: `p-1 rounded transition-all shrink-0 ${isHovered ? "opacity-100 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2" : "opacity-0"}`,
                title: "Ver documento fuente",
                children: /* @__PURE__ */ jsx(Eye, { size: 14 })
              }
            )
          ] })
        ] }),
        showClassificationColumns && (() => {
          const tipo = naturalezaPill(row.naturaleza);
          const renta = rentaPill(row.isVariable, row.naturaleza);
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "td",
              {
                className: `${T.cellCompact} text-center`,
                onClick: (e) => {
                  e.stopPropagation();
                  onToggleNaturaleza?.();
                },
                title: `${row.naturaleza || "Sin tipo"} \u2014 click para cambiar`,
                children: /* @__PURE__ */ jsx("span", { className: `${PILL} ${tipo.style}`, children: tipo.label })
              }
            ),
            /* @__PURE__ */ jsx(
              "td",
              {
                className: `${T.cellCompact} text-center ${T.vline}`,
                onClick: (e) => {
                  e.stopPropagation();
                  if (row.naturaleza !== "Legal") onToggleVariable?.();
                },
                title: row.naturaleza === "Legal" ? "Descuento legal" : row.isVariable ? "Variable \u2014 click para cambiar a Fija" : "Fija \u2014 click para cambiar a Variable",
                children: /* @__PURE__ */ jsx("span", { className: `${PILL} ${renta.style}`, children: renta.label })
              }
            )
          ] });
        })(),
        showVariableColumn && !showClassificationColumns && (() => {
          const renta = rentaPill(row.isVariable, void 0);
          return /* @__PURE__ */ jsx(
            "td",
            {
              className: `${T.cellCompact} text-center ${T.vline}`,
              onClick: (e) => {
                e.stopPropagation();
                onToggleVariable?.();
              },
              title: row.isVariable ? "Variable \u2014 click para cambiar a Fija" : "Fija \u2014 click para cambiar a Variable",
              children: /* @__PURE__ */ jsx("span", { className: `${PILL} ${renta.style}`, children: renta.label })
            }
          );
        })(),
        months.map((p, mi) => {
          const vline = mi < months.length - 1 ? T.vline : "";
          return /* @__PURE__ */ jsx(
            editablecell_default,
            {
              value: row.values[p.id] ?? null,
              onChange: (v) => onValueChange(p.id, v),
              isDeduction: subtract,
              hasData: row.values[p.id] !== void 0 && row.values[p.id] !== null,
              className: vline,
              type: "currency",
              originClass: getCellOriginClass?.(p.id),
              onViewSource: p.sourceFileId && onViewSource ? () => onViewSource([p.sourceFileId]) : void 0,
              keyboard,
              rowId: row.id,
              cellKey: p.id
            },
            p.id
          );
        }),
        /* @__PURE__ */ jsx("td", { className: T.actionCol, "aria-hidden": true })
      ]
    }
  );
};
var datarow_default = DataRow;
var addRowIdFor = (sectionType) => `__add__:${sectionType}`;
var AddRow = ({
  section,
  months,
  labelValue,
  onLabelChange,
  onAddRow,
  onAddRowWithValue,
  showVariableColumn = false,
  showClassificationColumns = false,
  keyboard
}) => {
  const subtract = isSubtractType(section.type);
  const bgClass = subtract ? "bg-status-pending/5 border-status-pending/20" : "bg-surface-1/40 border-edge-subtle/10";
  const rowId = addRowIdFor(section.type);
  return /* @__PURE__ */ jsxs("tr", { className: `border-b border-dashed ${bgClass}`, children: [
    /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${showClassificationColumns ? "" : T.vline}`, children: keyboard ? /* @__PURE__ */ jsx(
      gridtextinput_default,
      {
        keyboard,
        rowId,
        cellKey: LABEL_CELL_KEY,
        value: labelValue,
        onChange: onLabelChange,
        placeholder: section.placeholder,
        className: `w-full ${T.inputPlaceholder}`,
        onEnter: () => {
          if (labelValue.trim()) onAddRow(labelValue);
        }
      }
    ) : /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        placeholder: section.placeholder,
        value: labelValue,
        onChange: (e) => onLabelChange(e.target.value),
        className: `w-full ${T.inputPlaceholder}`,
        onKeyDown: (e) => {
          if (e.key === "Enter" && labelValue.trim()) {
            onAddRow(labelValue);
          }
        }
      }
    ) }),
    showClassificationColumns && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("td", { className: T.cellCompact }),
      /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} ${T.vline}` })
    ] }),
    showVariableColumn && !showClassificationColumns && /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} text-center ${T.vline}`, children: /* @__PURE__ */ jsx("span", { className: T.empty, children: "\u2014" }) }),
    months.map((p, mi) => /* @__PURE__ */ jsx(
      editablecell_default,
      {
        value: null,
        onChange: (v) => onAddRowWithValue(p.id, v),
        isDeduction: subtract,
        hasData: false,
        className: mi < months.length - 1 ? T.vline : "",
        type: "currency",
        keyboard,
        rowId,
        cellKey: p.id
      },
      p.id
    )),
    /* @__PURE__ */ jsx("td", { className: T.actionCol })
  ] });
};
var addrow_default = AddRow;
var GroupRow = ({
  group,
  childRows,
  months,
  isHovered,
  forceExpanded,
  formatValue,
  hoverProps,
  onToggleCollapse,
  onUngroup,
  onLabelChange,
  showVariableColumn = false,
  showClassificationColumns = false,
  isDragging = false,
  dropIndicator,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  const groupValues = useMemo(() => computeGroupValues(childRows, months), [childRows, months]);
  const subtract = isSubtractType(group.type);
  const isExpanded = forceExpanded || !group.collapsed;
  const dropBorder = dropIndicator === "above" ? "border-t-2 border-t-brand" : dropIndicator === "below" ? "border-b-2 border-b-brand" : "";
  return /* @__PURE__ */ jsxs(
    "tr",
    {
      className: `border-b border-edge-subtle/10 ${subtract ? "bg-status-pending/10" : "bg-surface-1/60"} ${isDragging ? "opacity-40" : ""} ${dropBorder} group`,
      ...hoverProps,
      onDragOver,
      onDragLeave,
      onDrop,
      children: [
        /* @__PURE__ */ jsx("td", { className: `${T.cellEditLabel} text-ink-secondary overflow-hidden ${showClassificationColumns ? "" : T.vline}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 min-w-0", children: [
          onDragStart && /* @__PURE__ */ jsx(
            "span",
            {
              draggable: isHovered,
              onDragStart,
              onDragEnd,
              className: `shrink-0 cursor-grab active:cursor-grabbing text-ink-tertiary/60 hover:text-ink-tertiary transition-opacity ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`,
              title: "Arrastrar para reordenar",
              children: /* @__PURE__ */ jsx(GripVertical, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onToggleCollapse,
              className: "p-0.5 rounded shrink-0 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2",
              title: isExpanded ? "Colapsar grupo" : "Expandir grupo",
              children: isExpanded ? /* @__PURE__ */ jsx(ChevronDown, { size: 14 }) : /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: group.label,
              onChange: (e) => onLabelChange(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") e.target.blur();
              },
              className: "flex-1 min-w-0 bg-transparent border-none outline-none text-xs font-semibold text-ink-secondary truncate",
              title: group.label
            }
          )
        ] }) }),
        showClassificationColumns && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("td", { className: T.cellCompact }),
          /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} ${T.vline}` })
        ] }),
        showVariableColumn && !showClassificationColumns && /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} text-center ${T.vline}`, children: /* @__PURE__ */ jsx("span", { className: T.empty, children: "\u2014" }) }),
        months.map((p, mi) => {
          const value = groupValues[p.id] ?? 0;
          const hasValue = value !== 0;
          const vline = mi < months.length - 1 ? T.vline : "";
          return /* @__PURE__ */ jsx(
            "td",
            {
              className: `${T.cellEdit} text-right ${vline}`,
              children: /* @__PURE__ */ jsx("div", { className: "h-5 flex items-center justify-end", children: /* @__PURE__ */ jsx("span", { className: `text-xs tabular-nums font-medium ${subtract ? hasValue ? "text-status-pending" : "text-ink-tertiary/60" : hasValue ? "text-ink-primary" : "text-ink-tertiary/60"}`, children: hasValue ? formatValue(value) : "\u2014" }) })
            },
            p.id
          );
        }),
        /* @__PURE__ */ jsx("td", { className: `${T.actionCol} text-center`, children: isHovered && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onUngroup,
            className: "p-0.5 rounded text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2",
            title: "Desagrupar",
            children: /* @__PURE__ */ jsx(Ungroup, { size: 14 })
          }
        ) })
      ]
    }
  );
};
var grouprow_default = GroupRow;
var DeleteDialog = ({ count, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const inputRef = useRef(null);
  const cardRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);
  const handleBackdropClick = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      onCancel();
    }
  };
  const handleSubmit = () => {
    onConfirm(reason.trim());
  };
  const dialog = /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm",
      onClick: handleBackdropClick,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ref: cardRef,
          className: "bg-surface-1 border border-edge-subtle/20 rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center",
          children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-status-pending/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Trash2, { size: 24, className: "text-status-pending" }) }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-ink-primary mb-2", children: "\xBFCu\xE1l es la raz\xF3n para borrar?" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-tertiary mb-5", children: count === 1 ? "Esta fila se mover\xE1 a la papelera." : `${count} filas se mover\xE1n a la papelera.` }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                ref: inputRef,
                value: reason,
                onChange: (e) => setReason(e.target.value),
                placeholder: "Escribe una raz\xF3n...",
                rows: 2,
                className: "w-full text-sm bg-surface-0 text-ink-primary border border-edge-subtle/20 rounded-lg px-3 py-2 mb-5 outline-none focus:border-status-pending/60 focus:ring-1 focus:ring-status-pending/40 resize-none placeholder-ink-tertiary/60",
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSubmit,
                  className: "flex-1 py-2.5 rounded-lg bg-status-pending text-status-pending-contrast text-sm font-medium hover:bg-status-pending/80 transition-colors",
                  children: "Confirmar"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onCancel,
                  className: "flex-1 py-2.5 rounded-lg border border-edge-subtle/20 text-ink-secondary text-sm font-medium hover:bg-surface-2 transition-colors",
                  children: "Cancelar"
                }
              )
            ] })
          ]
        }
      )
    }
  );
  if (typeof document !== "undefined") {
    return createPortal(dialog, document.body);
  }
  return dialog;
};
var deletedialog_default = DeleteDialog;
function RecycleBin({ deletedRows, getLabel, onRestore, renderCells }) {
  const [expanded, setExpanded] = useState(false);
  if (deletedRows.length === 0) return null;
  return /* @__PURE__ */ jsxs("div", { className: "border-t border-edge-subtle/10 bg-surface-1/50", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setExpanded(!expanded),
        className: "w-full px-4 py-2 flex items-center gap-2 text-xs text-ink-tertiary hover:text-ink-secondary hover:bg-surface-1 transition-colors",
        children: [
          /* @__PURE__ */ jsx(Trash2, { size: 12 }),
          /* @__PURE__ */ jsxs("span", { children: [
            deletedRows.length,
            " eliminado",
            deletedRows.length !== 1 ? "s" : ""
          ] }),
          expanded ? /* @__PURE__ */ jsx(ChevronUp, { size: 12 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 12 })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsx("table", { className: T.table, children: /* @__PURE__ */ jsx("tbody", { children: deletedRows.map((row) => /* @__PURE__ */ jsxs("tr", { className: `${T.rowBorder} opacity-75`, children: [
      /* @__PURE__ */ jsx("td", { className: `${T.cellEditLabel} text-ink-tertiary ${T.cellLabel}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 min-w-0", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onRestore(row.id),
            className: "shrink-0 p-1 rounded text-ink-tertiary hover:text-status-ok hover:bg-status-ok/10 transition-colors",
            title: "Restaurar",
            children: /* @__PURE__ */ jsx(Undo2, { size: 13 })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `${T.rowLabel} line-through text-ink-tertiary truncate block`,
              title: getLabel(row),
              children: getLabel(row)
            }
          ),
          row.deletedAt && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-ink-tertiary truncate block", title: row.deletionReason, children: [
            formatDeletedDate(row.deletedAt),
            row.deletionReason && ` \xB7 ${row.deletionReason}`
          ] })
        ] })
      ] }) }),
      renderCells && renderCells(row)
    ] }, row.id)) }) })
  ] });
}
var recyclebin_default = RecycleBin;
var ContextMenu = ({ x, y, canGroup, selectedCount, onGroup, onDeleteSelected, onCancel, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      ref.current.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight) {
      ref.current.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }, []);
  const menu = /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: "fixed z-50 bg-surface-1 border border-edge-subtle/20 rounded-lg shadow-lg py-1 min-w-[180px] text-ink-primary print:hidden",
      style: { left: x, top: y },
      children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              onGroup();
              onClose();
            },
            disabled: !canGroup,
            className: "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-surface-2 disabled:text-ink-tertiary/50 disabled:hover:bg-transparent",
            children: [
              /* @__PURE__ */ jsx(FoldVertical, { size: 14 }),
              "Agrupar ",
              selectedCount,
              " filas"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              onDeleteSelected();
              onClose();
            },
            className: "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-surface-2 text-status-pending",
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 14 }),
              "Eliminar ",
              selectedCount,
              " fila",
              selectedCount !== 1 ? "s" : ""
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              onCancel();
              onClose();
            },
            className: "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-surface-2 text-ink-secondary",
            children: [
              /* @__PURE__ */ jsx(X, { size: 14 }),
              "Cancelar selecci\xF3n"
            ]
          }
        )
      ]
    }
  );
  if (typeof document !== "undefined") {
    return createPortal(menu, document.body);
  }
  return menu;
};
var HeaderSelectionBar = ({ selectedCount, canGroup, monthCount, naming, onNamingChange, onGroup, onDeleteSelected, onCancel, showVariableColumn = false, showClassificationColumns = false }) => {
  const [groupName, setGroupName] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (naming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [naming]);
  useEffect(() => {
    if (selectedCount === 0) {
      setGroupName("");
    }
  }, [selectedCount]);
  const handleSubmit = () => {
    const name = groupName.trim();
    if (name) {
      onGroup(name);
      onNamingChange(false);
      setGroupName("");
    }
  };
  return /* @__PURE__ */ jsx(
    "td",
    {
      colSpan: monthCount + 2 + (showClassificationColumns ? 2 : showVariableColumn ? 1 : 0),
      className: "px-4 py-2.5",
      onClick: (e) => e.stopPropagation(),
      children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: naming ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "text",
            value: groupName,
            onChange: (e) => setGroupName(e.target.value),
            placeholder: "Nombre del grupo...",
            className: "text-xs border border-edge-subtle/30 bg-surface-0 text-ink-primary placeholder-ink-tertiary/60 rounded px-2 py-1 outline-none focus:border-status-ok focus:ring-1 focus:ring-status-ok w-44",
            onKeyDown: (e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") {
                onNamingChange(false);
                setGroupName("");
              }
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSubmit,
            disabled: !groupName.trim(),
            className: "p-1 rounded text-status-ok hover:bg-status-ok/15 disabled:text-ink-tertiary/50 disabled:hover:bg-transparent",
            title: "Confirmar",
            children: /* @__PURE__ */ jsx(Check, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              onNamingChange(false);
              setGroupName("");
            },
            className: "p-1 rounded text-ink-tertiary hover:bg-surface-2",
            title: "Cancelar",
            children: /* @__PURE__ */ jsx(X, { size: 14 })
          }
        )
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-tertiary", children: [
          selectedCount,
          " fila",
          selectedCount !== 1 ? "s" : ""
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onNamingChange(true),
            disabled: !canGroup,
            className: "text-xs px-3 py-1 rounded-full bg-status-ok text-status-ok-contrast hover:bg-status-ok/80 disabled:bg-surface-2 disabled:text-ink-tertiary/60 disabled:cursor-not-allowed transition-colors",
            title: !canGroup && selectedCount < 2 ? "Selecciona al menos 2 filas" : !canGroup ? "Solo puedes agrupar filas del mismo tipo" : "Agrupar filas seleccionadas",
            children: "Agrupar"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onDeleteSelected,
            className: "text-xs px-3 py-1 rounded-full text-status-pending hover:bg-status-pending/15 transition-colors flex items-center gap-1",
            title: "Eliminar filas seleccionadas",
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 12 }),
              "Eliminar"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onCancel,
            className: "text-xs px-2 py-1 rounded-full text-ink-tertiary hover:bg-surface-2 transition-colors",
            children: "Cancelar"
          }
        )
      ] }) })
    }
  );
};
var useGridKeyboard = ({ visibleRowIds }) => {
  const [focusedCell, setFocusedCell] = useState(null);
  const [editRequest, setEditRequest] = useState(null);
  const [clearRequest, setClearRequest] = useState(null);
  const focusedCellRef = useRef(focusedCell);
  useEffect(() => {
    focusedCellRef.current = focusedCell;
  }, [focusedCell]);
  const visibleRowIdsRef = useRef(visibleRowIds);
  useEffect(() => {
    visibleRowIdsRef.current = visibleRowIds;
  }, [visibleRowIds]);
  const registryRef = useRef(/* @__PURE__ */ new Map());
  const register = useCallback((stop) => {
    const list = registryRef.current.get(stop.rowId);
    if (list) {
      if (process.env.NODE_ENV !== "production" && list.some((s) => s.cellKey === stop.cellKey)) {
        console.warn(
          `[useGridKeyboard] Duplicate stop registration: rowId="${stop.rowId}" cellKey="${stop.cellKey}". Only the first stop is reachable via cellKey lookups (arrow up/down, focus()). Check for a repeated column key or a stale registration.`
        );
      }
      list.push(stop);
    } else {
      registryRef.current.set(stop.rowId, [stop]);
    }
    return () => {
      const cur = registryRef.current.get(stop.rowId);
      if (!cur) return;
      const next = cur.filter((s) => s !== stop);
      if (next.length === 0) registryRef.current.delete(stop.rowId);
      else registryRef.current.set(stop.rowId, next);
    };
  }, []);
  const getOrderedStops = useCallback((rowId) => {
    const list = registryRef.current.get(rowId);
    if (!list || list.length === 0) return [];
    const alive = list.filter((s) => s.ref.current != null);
    alive.sort((a, b) => {
      const ar = a.ref.current;
      const br = b.ref.current;
      if (ar === br) return 0;
      const pos = ar.compareDocumentPosition(br);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    return alive;
  }, []);
  const isFocused = useCallback((rowId, cellKey) => {
    return focusedCell?.rowId === rowId && focusedCell?.cellKey === cellKey;
  }, [focusedCell]);
  const focus = useCallback((rowId, cellKey) => {
    setFocusedCell({ rowId, cellKey });
  }, []);
  const clearFocus = useCallback(() => setFocusedCell(null), []);
  const focusStop = useCallback((stop) => {
    stop.ref.current?.focus();
    setFocusedCell({ rowId: stop.rowId, cellKey: stop.cellKey });
  }, []);
  const navigate = useCallback((direction) => {
    const cur = focusedCellRef.current;
    if (!cur) return;
    const rowIds = visibleRowIdsRef.current;
    const rowIdx = rowIds.indexOf(cur.rowId);
    if (rowIdx === -1) return;
    const stops = getOrderedStops(cur.rowId);
    const colIdx = stops.findIndex((s) => s.cellKey === cur.cellKey);
    switch (direction) {
      case "right": {
        if (colIdx >= 0 && colIdx < stops.length - 1) {
          focusStop(stops[colIdx + 1]);
        } else {
          for (let i = rowIdx + 1; i < rowIds.length; i++) {
            const next = getOrderedStops(rowIds[i]);
            if (next.length > 0) {
              focusStop(next[0]);
              break;
            }
          }
        }
        break;
      }
      case "left": {
        if (colIdx > 0) {
          focusStop(stops[colIdx - 1]);
        } else {
          for (let i = rowIdx - 1; i >= 0; i--) {
            const prev = getOrderedStops(rowIds[i]);
            if (prev.length > 0) {
              focusStop(prev[prev.length - 1]);
              break;
            }
          }
        }
        break;
      }
      case "down": {
        for (let i = rowIdx + 1; i < rowIds.length; i++) {
          const next = getOrderedStops(rowIds[i]);
          if (next.length === 0) continue;
          const same = next.find((s) => s.cellKey === cur.cellKey);
          if (same) focusStop(same);
          return;
        }
        break;
      }
      case "up": {
        for (let i = rowIdx - 1; i >= 0; i--) {
          const prev = getOrderedStops(rowIds[i]);
          if (prev.length === 0) continue;
          const same = prev.find((s) => s.cellKey === cur.cellKey);
          if (same) focusStop(same);
          return;
        }
        break;
      }
    }
  }, [focusStop, getOrderedStops]);
  const handleContainerKeyDown = useCallback((e) => {
    if (!focusedCellRef.current) return;
    const target = e.target;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        navigate("up");
        break;
      case "ArrowDown":
        e.preventDefault();
        navigate("down");
        break;
      case "ArrowLeft":
        e.preventDefault();
        navigate("left");
        break;
      case "ArrowRight":
        e.preventDefault();
        navigate("right");
        break;
      case "Tab":
        e.preventDefault();
        navigate(e.shiftKey ? "left" : "right");
        break;
      case "Enter":
      case "F2": {
        e.preventDefault();
        const cur = focusedCellRef.current;
        if (!cur) return;
        setEditRequest((prev) => ({
          rowId: cur.rowId,
          cellKey: cur.cellKey,
          initialValue: null,
          n: (prev?.n ?? 0) + 1
        }));
        break;
      }
      case "Delete":
      case "Backspace": {
        e.preventDefault();
        const cur = focusedCellRef.current;
        if (!cur) return;
        setClearRequest((prev) => ({
          rowId: cur.rowId,
          cellKey: cur.cellKey,
          n: (prev?.n ?? 0) + 1
        }));
        break;
      }
      case "Escape":
        e.preventDefault();
        clearFocus();
        break;
      default: {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          const cur = focusedCellRef.current;
          if (!cur) return;
          setEditRequest((prev) => ({
            rowId: cur.rowId,
            cellKey: cur.cellKey,
            initialValue: e.key,
            n: (prev?.n ?? 0) + 1
          }));
        }
        break;
      }
    }
  }, [navigate, clearFocus]);
  return {
    focusedCell,
    editRequest,
    clearRequest,
    isFocused,
    focus,
    clearFocus,
    navigate,
    register,
    handleContainerKeyDown
  };
};

// src/renta/usekeyboard.ts
var useKeyboard = ({ visibleRowIds }) => useGridKeyboard({ visibleRowIds });
var useDragReorder = () => {
  const [dragRowId, setDragRowId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const handleDragStart = useCallback((rowId) => (e) => {
    setDragRowId(rowId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", rowId);
  }, []);
  const handleDragOver = useCallback((rowId) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (rowId === dragRowId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "above" : "below";
    setDropTargetId(rowId);
    setDropPosition(pos);
  }, [dragRowId]);
  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
    setDropPosition(null);
  }, []);
  const handleDrop = useCallback((rows, onRowsChange) => (e) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || !dropTargetId || sourceId === dropTargetId) {
      resetState();
      return;
    }
    const sourceRow = rows.find((r) => r.id === sourceId);
    const targetRow = rows.find((r) => r.id === dropTargetId);
    if (!sourceRow || !targetRow) {
      resetState();
      return;
    }
    if (!isSameFamily(sourceRow, targetRow)) {
      resetState();
      return;
    }
    const targetGroupId = targetRow.isGroup ? targetRow.id : targetRow.groupId ?? null;
    const sourceGroupId = sourceRow.groupId ?? null;
    let workingRows = rows;
    if (targetGroupId !== sourceGroupId) {
      workingRows = workingRows.map((r) => {
        if (r.id !== sourceId) return r;
        return targetGroupId !== null ? { ...r, groupId: targetGroupId } : { ...r, groupId: void 0 };
      });
      workingRows = autoUngroup(workingRows);
    }
    const idsToMove = /* @__PURE__ */ new Set();
    idsToMove.add(sourceId);
    if (sourceRow.isGroup) {
      workingRows.filter((r) => r.groupId === sourceId).forEach((r) => idsToMove.add(r.id));
    }
    const withoutSource = workingRows.filter((r) => !idsToMove.has(r.id));
    const sourceRows = workingRows.filter((r) => idsToMove.has(r.id));
    const targetIdx = withoutSource.findIndex((r) => r.id === dropTargetId);
    if (targetIdx === -1) {
      resetState();
      return;
    }
    const insertIdx = dropPosition === "below" ? targetIdx + 1 : targetIdx;
    const result = [...withoutSource];
    result.splice(insertIdx, 0, ...sourceRows);
    result.forEach((r, i) => {
      r.order = i;
    });
    onRowsChange(result);
    resetState();
  }, [dropTargetId, dropPosition]);
  const handleDragEnd = useCallback(() => {
    resetState();
  }, []);
  function resetState() {
    setDragRowId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }
  return {
    dragRowId,
    dropTargetId,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
};
function isSameFamily(a, b) {
  const isAdd = (t) => t === "add" || t === "income";
  return isAdd(a.type) === isAdd(b.type);
}
function useRowHover() {
  const [hoveredRow, setHoveredRow] = useState(null);
  const getHoverProps = useCallback((id) => ({
    onMouseEnter: () => setHoveredRow(id),
    onMouseLeave: () => setHoveredRow(null)
  }), []);
  const isHovered = useCallback((id) => hoveredRow === id, [hoveredRow]);
  return { hoveredRow, getHoverProps, isHovered };
}
var fmtK = (v) => {
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}k`;
  return `${sign}$${abs}`;
};
var ReliqInfoTooltip = ({ data, type }) => {
  const lines = type === "fija" ? [
    { label: "Imponible fijo", value: data.imponibleFijo, sign: "+" },
    { label: "No imponible fijo", value: data.noImponibleFijo, sign: "+" },
    { label: "Cotiz. previsional", value: data.cotizPreviFija, sign: "-" },
    { label: "Cotiz. salud", value: data.cotizSaludFija, sign: "-" },
    { label: "Cotiz. cesant\xEDa", value: data.cotizCesantiaFija, sign: "-" },
    { label: "Impuesto (IUSC)", value: data.impuestoFijo, sign: "-" },
    { label: "Otros desc. fijos", value: data.descuentosOtrosFijos, sign: "-" }
  ] : [
    { label: "L\xEDquido total", value: data.liquidoTotal, sign: "+" },
    { label: "Renta fija", value: data.rentaFija, sign: "-" }
  ];
  const result = type === "fija" ? data.rentaFija : data.rentaVariable;
  const isFija = type === "fija";
  return /* @__PURE__ */ jsx("div", { className: "hidden group-hover/reliq:block absolute bottom-full left-0 mb-2 z-50", children: /* @__PURE__ */ jsx("div", { className: "bg-surface-1 text-ink-secondary text-[11px] rounded-lg shadow-lg border border-edge-subtle/20 px-3 py-2.5 whitespace-nowrap", children: /* @__PURE__ */ jsx("table", { className: "border-spacing-0 w-full", children: /* @__PURE__ */ jsxs("tbody", { children: [
    /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: `pb-1.5 font-semibold text-[11px] text-left ${isFija ? "text-status-info" : "text-status-warn"}`, children: isFija ? "C\xE1lculo Renta Fija" : "C\xE1lculo Renta Variable" }) }),
    lines.filter((l) => l.value !== 0).map((l, i) => /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("td", { className: "pr-4 py-0.5 text-ink-tertiary text-left", children: l.label }),
      /* @__PURE__ */ jsxs("td", { className: "text-right py-0.5 tabular-nums text-ink-secondary", children: [
        l.sign === "-" ? "\u2212" : "+",
        fmtK(l.value)
      ] })
    ] }, i)),
    /* @__PURE__ */ jsxs("tr", { className: `border-t ${isFija ? "border-status-info/30" : "border-status-warn/30"}`, children: [
      /* @__PURE__ */ jsx("td", { className: `pr-4 pt-1.5 font-semibold text-left ${isFija ? "text-status-info" : "text-status-warn"}`, children: isFija ? "Renta Fija" : "Renta Variable" }),
      /* @__PURE__ */ jsx("td", { className: `text-right pt-1.5 font-semibold tabular-nums ${isFija ? "text-status-info" : "text-status-warn"}`, children: fmtK(result) })
    ] })
  ] }) }) }) });
};
var RentaTable = ({
  title,
  months = 6,
  rows,
  onRowsChange,
  sections,
  colorScheme: colorSchemeProp,
  headerBg: headerBgProp,
  headerText: headerTextProp,
  forceExpanded = false,
  formatValue = defaultFormatValue,
  calculateTotal = defaultCalculateTotal,
  showVariableColumn = false,
  showClassificationColumns = false,
  sourceFileIds,
  onViewSource,
  reliquidacion,
  getCellOriginClass
}) => {
  const { bg: headerBg, text: headerText } = resolveColors(colorSchemeProp, headerBgProp, headerTextProp);
  const { getHoverProps, isHovered: isRowHovered } = useRowHover();
  const [newRowLabels, setNewRowLabels] = useState({});
  const [selectedRows, setSelectedRows] = useState(/* @__PURE__ */ new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [naming, setNaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const monthsArray = useMemo(() => {
    if (typeof months === "number") return generateLastNMonths(months);
    return months;
  }, [months]);
  const effectiveSections = useMemo(() => {
    if (sections) return sections;
    const hasIncome = rows.some((r) => r.type === "income");
    const hasDeduction = rows.some((r) => r.type === "deduction");
    const hasDebt = rows.some((r) => r.type === "debt");
    const hasAdd = rows.some((r) => r.type === "add");
    const hasSubtract = rows.some((r) => r.type === "subtract");
    const result = [];
    if (hasIncome || hasAdd) result.push({ type: hasIncome ? "income" : "add", placeholder: "Agregar ingreso..." });
    if (hasDeduction) result.push({ type: "deduction", placeholder: "Agregar descuento..." });
    if (hasDebt) result.push({ type: "debt", placeholder: "Agregar deuda..." });
    if (hasSubtract && !hasDeduction && !hasDebt) result.push({ type: "subtract", placeholder: "Agregar descuento..." });
    if (result.length === 0) result.push({ type: "add", placeholder: "Agregar fila..." });
    return result;
  }, [sections, rows]);
  const anySelected = selectedRows.size > 0;
  const visibleRowIds = useMemo(() => {
    const ids = [];
    for (const section of effectiveSections) {
      const items = getOrderedItems(rows, section.type);
      for (const item of items) {
        if (item.kind === "group") {
          const showChildren = forceExpanded || !item.group.collapsed;
          if (showChildren) {
            for (const child of item.children) ids.push(child.id);
          }
        } else {
          ids.push(item.row.id);
        }
      }
      ids.push(`__add__:${section.type}`);
    }
    return ids;
  }, [effectiveSections, rows, forceExpanded]);
  const keyboard = useKeyboard({ visibleRowIds });
  const drag = useDragReorder();
  const expandTimerRef = useRef(null);
  useEffect(() => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    if (!drag.dropTargetId || forceExpanded) return;
    const target = rows.find((r) => r.id === drag.dropTargetId);
    if (!target?.isGroup || !target.collapsed) return;
    expandTimerRef.current = setTimeout(() => toggleGroupCollapse(target.id), 600);
    return () => {
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
    };
  }, [drag.dropTargetId]);
  const toggleSelect = useCallback((rowId) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedRows(/* @__PURE__ */ new Set()), []);
  const canGroup = useMemo(() => {
    if (selectedRows.size < 2) return false;
    const selected = rows.filter((r) => selectedRows.has(r.id));
    if (selected.some((r) => r.isGroup)) return false;
    const types = new Set(selected.map((r) => isAddType(r.type) ? "add" : "subtract"));
    return types.size === 1;
  }, [selectedRows, rows]);
  const handleGroup = useCallback((name) => {
    const newRows = createGroup(rows, selectedRows, name);
    onRowsChange(newRows);
    clearSelection();
    setNaming(false);
  }, [rows, selectedRows, onRowsChange, clearSelection]);
  const handleContextMenu = useCallback((e, rowId) => {
    if (!selectedRows.has(rowId) || selectedRows.size < 2) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [selectedRows]);
  const startGroupNaming = useCallback(() => {
    setContextMenu(null);
    setNaming(true);
  }, []);
  const updateRowLabel = useCallback((rowId, label) => {
    onRowsChange(rows.map((r) => r.id === rowId ? { ...r, label } : r));
  }, [rows, onRowsChange]);
  const updateRowValue = useCallback((rowId, monthId, value) => {
    onRowsChange(rows.map((r) => {
      if (r.id !== rowId) return r;
      return { ...r, values: { ...r.values, [monthId]: value } };
    }));
  }, [rows, onRowsChange]);
  const requestDelete = useCallback((rowId) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    if (row.isGroup) {
      onRowsChange(ungroupRows(rows, rowId));
      return;
    }
    setDeleteTarget(/* @__PURE__ */ new Set([rowId]));
  }, [rows, onRowsChange]);
  const requestDeleteSelected = useCallback(() => {
    setDeleteTarget(new Set(selectedRows));
  }, [selectedRows]);
  const confirmDelete = useCallback((reason) => {
    if (!deleteTarget) return;
    const newRows = softDeleteRows(rows, deleteTarget, reason);
    onRowsChange(newRows);
    clearSelection();
    setDeleteTarget(null);
  }, [rows, deleteTarget, onRowsChange, clearSelection]);
  const handleRestore = useCallback((rowId) => {
    onRowsChange(restoreRows(rows, /* @__PURE__ */ new Set([rowId])));
  }, [rows, onRowsChange]);
  const deletedRows = useMemo(
    () => rows.filter((r) => r.deletedAt && !r.isGroup),
    [rows]
  );
  const toggleGroupCollapse = useCallback((groupId) => {
    onRowsChange(rows.map((r) => r.id === groupId ? { ...r, collapsed: !r.collapsed } : r));
  }, [rows, onRowsChange]);
  const handleUngroup = useCallback((groupId) => {
    onRowsChange(ungroupRows(rows, groupId));
  }, [rows, onRowsChange]);
  const toggleVariable = useCallback((rowId) => {
    onRowsChange(rows.map((r) => {
      if (r.id !== rowId) return r;
      return { ...r, isVariable: !r.isVariable };
    }));
  }, [rows, onRowsChange]);
  const toggleNaturaleza = useCallback((rowId) => {
    onRowsChange(rows.map((r) => {
      if (r.id !== rowId) return r;
      const isIncome = isAddType(r.type);
      const cycle = isIncome ? ["Imponible", "No imponible"] : ["Legal", "Otro"];
      const next = r.naturaleza ? cycle[(cycle.indexOf(r.naturaleza) + 1) % cycle.length] : cycle[0];
      return { ...r, naturaleza: next };
    }));
  }, [rows, onRowsChange]);
  const addRow = useCallback((type, label) => {
    if (!label.trim()) return;
    const newRow = { id: `row_${type}_${Date.now()}`, label: label.trim(), type, values: {} };
    setNewRowLabels((prev) => ({ ...prev, [type]: "" }));
    if (isAddType(type)) {
      const subtractIndex = rows.findIndex((r) => isSubtractType(r.type));
      if (subtractIndex === -1) {
        onRowsChange([...rows, newRow]);
      } else {
        const updated = [...rows];
        updated.splice(subtractIndex, 0, newRow);
        onRowsChange(updated);
      }
    } else {
      onRowsChange([...rows, newRow]);
    }
  }, [rows, onRowsChange]);
  const addRowWithValue = useCallback((type, monthId, value) => {
    if (value === null) return;
    const pendingLabel = (newRowLabels[type] || "").trim();
    const defaultLabel = isAddType(type) ? "Nuevo ingreso" : "Nuevo descuento";
    const newRow = { id: `row_${type}_${Date.now()}`, label: pendingLabel || defaultLabel, type, values: { [monthId]: value } };
    setNewRowLabels((prev) => ({ ...prev, [type]: "" }));
    if (isAddType(type)) {
      const subtractIndex = rows.findIndex((r) => isSubtractType(r.type));
      if (subtractIndex === -1) {
        onRowsChange([...rows, newRow]);
      } else {
        const updated = [...rows];
        updated.splice(subtractIndex, 0, newRow);
        onRowsChange(updated);
      }
    } else {
      onRowsChange([...rows, newRow]);
    }
  }, [rows, onRowsChange, newRowLabels]);
  const renderDataRow = (r) => /* @__PURE__ */ jsx(
    datarow_default,
    {
      row: r,
      months: monthsArray,
      isHovered: isRowHovered(r.id),
      selected: selectedRows.has(r.id),
      anySelected,
      selectable: !r.isGroup,
      hoverProps: getHoverProps(r.id),
      onRemove: () => requestDelete(r.id),
      onToggleSelect: () => toggleSelect(r.id),
      onContextMenu: (e) => handleContextMenu(e, r.id),
      onLabelChange: (label) => updateRowLabel(r.id, label),
      onValueChange: (monthId, value) => updateRowValue(r.id, monthId, value),
      onViewSource,
      showVariableColumn,
      showClassificationColumns,
      onToggleVariable: () => toggleVariable(r.id),
      onToggleNaturaleza: () => toggleNaturaleza(r.id),
      keyboard,
      isDragging: drag.dragRowId === r.id,
      dropIndicator: drag.dropTargetId === r.id ? drag.dropPosition : null,
      onDragStart: drag.handleDragStart(r.id),
      onDragOver: drag.handleDragOver(r.id),
      onDragLeave: drag.handleDragLeave,
      onDrop: drag.handleDrop(rows, onRowsChange),
      onDragEnd: drag.handleDragEnd,
      getCellOriginClass: getCellOriginClass ? (monthId) => getCellOriginClass(r.id, monthId) : void 0
    },
    r.id
  );
  return /* @__PURE__ */ jsx(
    "div",
    {
      tabIndex: 0,
      onKeyDown: keyboard.handleContainerKeyDown,
      className: "outline-none",
      children: /* @__PURE__ */ jsxs(
        tableshell_default,
        {
          headerBg,
          renderHeader: () => anySelected ? /* @__PURE__ */ jsx(
            HeaderSelectionBar,
            {
              selectedCount: selectedRows.size,
              canGroup,
              monthCount: monthsArray.length,
              naming,
              onNamingChange: setNaming,
              onGroup: handleGroup,
              onDeleteSelected: requestDeleteSelected,
              onCancel: () => {
                clearSelection();
                setNaming(false);
              },
              showVariableColumn,
              showClassificationColumns
            }
          ) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("td", { className: `${T.headerAccordion} text-left ${showClassificationColumns ? "" : T.vline}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: `${headerText} ${T.headerTitle}`, children: title }),
              /* @__PURE__ */ jsx(SourceIcon, { fileIds: sourceFileIds, onViewSource, className: headerText })
            ] }) }),
            showClassificationColumns && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} text-center`, children: /* @__PURE__ */ jsx("span", { className: `${headerText} text-xs font-semibold opacity-60`, children: "Tipo" }) }),
              /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} text-center ${T.vline}`, children: /* @__PURE__ */ jsx("span", { className: `${headerText} text-xs font-semibold opacity-60`, children: "Renta" }) })
            ] }),
            showVariableColumn && !showClassificationColumns && /* @__PURE__ */ jsx("td", { className: T.vline }),
            monthsArray.map((p) => {
              const total = calculateTotal(p.id, rows);
              const hasValue = total !== 0;
              return /* @__PURE__ */ jsxs("td", { className: `${T.headerAccordionStat}`, children: [
                /* @__PURE__ */ jsx("span", { className: `${headerText} ${T.headerStatLabel} mr-1`, children: p.label }),
                /* @__PURE__ */ jsx("span", { className: `${T.headerStat} ${hasValue ? headerText : "text-ink-tertiary"}`, children: hasValue ? formatValue(total) : "\u2014" })
              ] }, p.id);
            }),
            /* @__PURE__ */ jsx("td", { className: T.actionCol })
          ] }),
          renderAfterContent: () => /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              recyclebin_default,
              {
                deletedRows,
                getLabel: (r) => r.label,
                onRestore: handleRestore,
                renderCells: (row) => {
                  const subtract = isSubtractType(row.type);
                  return /* @__PURE__ */ jsxs(Fragment, { children: [
                    showVariableColumn && /* @__PURE__ */ jsx("td", { className: T.vline }),
                    monthsArray.map((m, mi) => {
                      const v = row.values[m.id];
                      const hasValue = v != null;
                      const vline = mi < monthsArray.length - 1 ? T.vline : "";
                      return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} text-right tabular-nums ${vline}`, children: /* @__PURE__ */ jsx("span", { className: `${T.totalValue} ${hasValue ? subtract ? "text-status-pending/70" : "text-ink-tertiary" : "text-ink-tertiary/50"}`, children: hasValue ? formatValue(v) : "\u2014" }) }, m.id);
                    }),
                    /* @__PURE__ */ jsx("td", { className: T.actionCol })
                  ] });
                }
              }
            ),
            deleteTarget && /* @__PURE__ */ jsx(
              deletedialog_default,
              {
                count: deleteTarget.size,
                onConfirm: confirmDelete,
                onCancel: () => setDeleteTarget(null)
              }
            ),
            contextMenu && anySelected && /* @__PURE__ */ jsx(
              ContextMenu,
              {
                x: contextMenu.x,
                y: contextMenu.y,
                canGroup,
                selectedCount: selectedRows.size,
                onGroup: startGroupNaming,
                onDeleteSelected: requestDeleteSelected,
                onCancel: clearSelection,
                onClose: () => setContextMenu(null)
              }
            )
          ] }),
          children: [
            effectiveSections.map((section) => {
              const items = getOrderedItems(rows, section.type);
              return /* @__PURE__ */ jsxs(React3.Fragment, { children: [
                items.map((item) => {
                  if (item.kind === "group") {
                    const { group, children: groupChildren } = item;
                    const showChildren = forceExpanded || !group.collapsed;
                    return /* @__PURE__ */ jsxs(React3.Fragment, { children: [
                      /* @__PURE__ */ jsx(
                        grouprow_default,
                        {
                          group,
                          childRows: groupChildren,
                          months: monthsArray,
                          isHovered: isRowHovered(group.id),
                          forceExpanded,
                          formatValue,
                          hoverProps: getHoverProps(group.id),
                          onToggleCollapse: () => toggleGroupCollapse(group.id),
                          onUngroup: () => handleUngroup(group.id),
                          onLabelChange: (label) => updateRowLabel(group.id, label),
                          showVariableColumn,
                          showClassificationColumns,
                          isDragging: drag.dragRowId === group.id,
                          dropIndicator: drag.dropTargetId === group.id ? drag.dropPosition : null,
                          onDragStart: drag.handleDragStart(group.id),
                          onDragOver: drag.handleDragOver(group.id),
                          onDragLeave: drag.handleDragLeave,
                          onDrop: drag.handleDrop(rows, onRowsChange),
                          onDragEnd: drag.handleDragEnd
                        }
                      ),
                      showChildren && groupChildren.map((child) => renderDataRow(child))
                    ] }, group.id);
                  }
                  return renderDataRow(item.row);
                }),
                /* @__PURE__ */ jsx(
                  addrow_default,
                  {
                    section,
                    months: monthsArray,
                    labelValue: newRowLabels[section.type] || "",
                    onLabelChange: (v) => setNewRowLabels((prev) => ({ ...prev, [section.type]: v })),
                    onAddRow: (label) => addRow(section.type, label),
                    onAddRowWithValue: (monthId, value) => addRowWithValue(section.type, monthId, value),
                    showVariableColumn,
                    showClassificationColumns,
                    keyboard
                  }
                ),
                effectiveSections.length > 1 && (() => {
                  const subtotals = computeSectionSubtotal(rows, section.type, monthsArray);
                  const isSubtract = isSubtractType(section.type);
                  const label = isSubtract ? "Total descuentos" : "Total haberes";
                  return /* @__PURE__ */ jsxs("tr", { className: `${isSubtract ? "bg-status-pending/5" : "bg-status-ok/5"}`, children: [
                    /* @__PURE__ */ jsx("td", { className: `${T.totalCell} border-b border-edge-subtle/10 ${showClassificationColumns ? "" : T.vline}`, children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-xs text-ink-tertiary", children: label }) }),
                    showClassificationColumns && /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} border-b border-edge-subtle/10` }),
                      /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} border-b border-edge-subtle/10 ${T.vline}` })
                    ] }),
                    showVariableColumn && !showClassificationColumns && /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} border-b border-edge-subtle/10 ${T.vline}` }),
                    monthsArray.map((p, mi) => {
                      const value = subtotals[p.id] ?? 0;
                      const hasValue = value !== 0;
                      const display = isSubtract ? `-${formatValue(value)}` : formatValue(value);
                      const vline = mi < monthsArray.length - 1 ? T.vline : "";
                      return /* @__PURE__ */ jsx("td", { className: `${T.totalCell} text-right border-b border-edge-subtle/10 ${vline}`, children: /* @__PURE__ */ jsx("span", { className: `font-semibold text-xs tabular-nums ${hasValue ? "text-ink-tertiary" : "text-ink-tertiary/50"}`, children: hasValue ? display : "\u2014" }) }, p.id);
                    }),
                    /* @__PURE__ */ jsx("td", { className: `${T.actionCol} border-b border-edge-subtle/10` })
                  ] });
                })()
              ] }, section.type);
            }),
            (showVariableColumn || showClassificationColumns) && effectiveSections.length > 1 && (() => {
              const naiveVariable = computeRentaVariable(rows, monthsArray);
              const fmtSigned = (v) => v < 0 ? `-${formatValue(-v)}` : formatValue(v);
              return /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("tr", { className: "border-b border-edge-subtle/10 bg-status-warn/5 group/rv", children: [
                  /* @__PURE__ */ jsx("td", { className: `${T.totalCell} ${showClassificationColumns ? "" : T.vline}`, children: /* @__PURE__ */ jsx("span", { className: `${T.totalLabel} text-status-warn`, children: "Renta Variable" }) }),
                  showClassificationColumns && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("td", { className: T.cellCompact }),
                    /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} ${T.vline}` })
                  ] }),
                  showVariableColumn && !showClassificationColumns && /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} text-center ${T.vline}`, children: /* @__PURE__ */ jsx("span", { className: T.empty, children: "\u2014" }) }),
                  monthsArray.map((p, mi) => {
                    const rliq = reliquidacion?.[p.id];
                    const value = rliq ? rliq.rentaVariable : naiveVariable[p.id] ?? 0;
                    const hasValue = value !== 0;
                    const vline = mi < monthsArray.length - 1 ? T.vline : "";
                    return /* @__PURE__ */ jsxs("td", { className: `${T.totalCell} text-right relative ${vline}`, children: [
                      rliq && hasValue && /* @__PURE__ */ jsxs("span", { className: "group/reliq absolute cursor-help opacity-0 group-hover/rv:opacity-100 transition-opacity", style: { top: "9px", left: "12px" }, children: [
                        /* @__PURE__ */ jsx(Info, { size: 14, className: "text-ink-tertiary hover:text-ink-secondary p-0.5 rounded hover:bg-surface-2" }),
                        /* @__PURE__ */ jsx(ReliqInfoTooltip, { data: rliq, type: "variable" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: `${T.totalValue} tabular-nums ${hasValue ? "text-status-warn" : "text-ink-tertiary/60"}`, children: hasValue ? fmtSigned(value) : "\u2014" })
                    ] }, p.id);
                  }),
                  /* @__PURE__ */ jsx("td", { className: T.actionCol })
                ] }),
                /* @__PURE__ */ jsxs("tr", { className: "border-b border-edge-subtle/10 bg-status-info/5 group/rf", children: [
                  /* @__PURE__ */ jsx("td", { className: `${T.totalCell} ${showClassificationColumns ? "" : T.vline}`, children: /* @__PURE__ */ jsx("span", { className: `${T.totalLabel} text-status-info`, children: "Renta Fija" }) }),
                  showClassificationColumns && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("td", { className: T.cellCompact }),
                    /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} ${T.vline}` })
                  ] }),
                  showVariableColumn && !showClassificationColumns && /* @__PURE__ */ jsx("td", { className: `${T.cellCompact} text-center ${T.vline}`, children: /* @__PURE__ */ jsx("span", { className: T.empty, children: "\u2014" }) }),
                  monthsArray.map((p, mi) => {
                    const rliq = reliquidacion?.[p.id];
                    const fija = rliq ? rliq.rentaFija : calculateTotal(p.id, rows) - (naiveVariable[p.id] ?? 0);
                    const hasValue = fija !== 0;
                    const vline = mi < monthsArray.length - 1 ? T.vline : "";
                    return /* @__PURE__ */ jsxs("td", { className: `${T.totalCell} text-right relative ${vline}`, children: [
                      rliq && hasValue && /* @__PURE__ */ jsxs("span", { className: "group/reliq absolute cursor-help opacity-0 group-hover/rf:opacity-100 transition-opacity", style: { top: "9px", left: "12px" }, children: [
                        /* @__PURE__ */ jsx(Info, { size: 14, className: "text-ink-tertiary hover:text-ink-secondary p-0.5 rounded hover:bg-surface-2" }),
                        /* @__PURE__ */ jsx(ReliqInfoTooltip, { data: rliq, type: "fija" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: `${T.totalValue} tabular-nums ${hasValue ? "text-status-info" : "text-ink-tertiary/60"}`, children: hasValue ? fmtSigned(fija) : "\u2014" })
                    ] }, p.id);
                  }),
                  /* @__PURE__ */ jsx("td", { className: T.actionCol })
                ] })
              ] });
            })()
          ]
        }
      )
    }
  );
};
var renta_default = RentaTable;
var ClickableHeader = ({ onClick, borderColor, className, children }) => /* @__PURE__ */ jsx(
  "span",
  {
    className: `whitespace-nowrap ${onClick ? `cursor-pointer select-none inline-flex items-center gap-1 rounded-full border ${borderColor || "border-edge-subtle/30"} px-2 py-0.5 -mx-2 -my-0.5 transition-colors` : ""} ${className || ""}`,
    onClick: onClick ? (e) => {
      e.stopPropagation();
      onClick();
    } : void 0,
    children
  }
);
var clickableheader_default = ClickableHeader;
var SHORT_MONTHS = {
  enero: "Ene",
  febrero: "Feb",
  marzo: "Mar",
  abril: "Abr",
  mayo: "May",
  junio: "Jun",
  julio: "Jul",
  agosto: "Ago",
  septiembre: "Sep",
  octubre: "Oct",
  noviembre: "Nov",
  diciembre: "Dic"
};
var METRICS = [
  { key: "bruto", label: "Honor. Bruto", color: "text-ink-primary", format: (v) => displayCurrencyCompact(v) },
  { key: "retencion", label: "Retenci\xF3n", color: "text-status-pending", format: (v) => displayCurrencyCompact(v) },
  { key: "boletas", label: "Boletas Vig.", color: "text-ink-primary", format: (v) => v != null ? String(v) : "\u2014" }
];
var BoletasTable = ({
  title,
  months,
  colorScheme: colorSchemeProp,
  headerBg: headerBgProp,
  headerText: headerTextProp,
  sourceFileIds,
  onViewSource,
  excludedMonths,
  onToggleMonth,
  onToggleAll,
  getCellOriginClass
}) => {
  const { bg: headerBg, text: headerText, border: borderColor } = resolveColors(colorSchemeProp, headerBgProp, headerTextProp);
  const excluded = excludedMonths ?? [];
  const allExcluded = months.length > 0 && months.every((m) => excluded.includes(m.periodo));
  return /* @__PURE__ */ jsx(
    tableshell_default,
    {
      headerBg,
      renderHeader: () => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("td", { className: `${T.headerAccordion} text-left ${T.vline} ${allExcluded ? "opacity-35" : ""}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(clickableheader_default, { onClick: onToggleAll, borderColor, children: /* @__PURE__ */ jsx("span", { className: `${headerText} ${T.headerTitle}`, children: title }) }),
          /* @__PURE__ */ jsx(SourceIcon, { fileIds: sourceFileIds, onViewSource, className: headerText })
        ] }) }),
        months.map((m) => {
          const isExcluded = excluded.includes(m.periodo);
          const canToggle = !!onToggleMonth;
          const hasValue = m.hasData && m.liquido != null;
          const label = SHORT_MONTHS[m.mes] || m.mes.charAt(0).toUpperCase() + m.mes.slice(1, 3);
          return /* @__PURE__ */ jsx(
            "td",
            {
              className: `${T.headerAccordionStat} ${isExcluded ? "opacity-35 line-through" : ""}`,
              children: /* @__PURE__ */ jsxs(clickableheader_default, { onClick: canToggle ? () => onToggleMonth(m.periodo) : void 0, borderColor, children: [
                /* @__PURE__ */ jsx("span", { className: `${headerText} ${T.headerStatLabel}`, children: label }),
                /* @__PURE__ */ jsx("span", { className: `${T.headerStat} ${hasValue ? headerText : "text-ink-tertiary"}`, children: hasValue ? displayCurrencyCompact(m.liquido) : "\u2014" })
              ] })
            },
            m.periodo
          );
        })
      ] }),
      children: METRICS.map((metric) => /* @__PURE__ */ jsxs("tr", { className: T.rowBorder, children: [
        /* @__PURE__ */ jsx("td", { className: `${T.cell} font-medium ${T.cellLabel} text-ink-secondary ${T.vline}`, children: metric.label }),
        months.map((m) => {
          const isExcluded = excluded.includes(m.periodo);
          return /* @__PURE__ */ jsx(
            "td",
            {
              className: `${T.cell} text-right ${m.hasData ? getCellOriginClass?.(metric.key, m.periodo) || metric.color : "text-ink-tertiary/60"} ${isExcluded ? "opacity-35" : ""}`,
              children: m.hasData ? metric.format(m[metric.key]) : "\u2014"
            },
            m.periodo
          );
        })
      ] }, metric.key))
    }
  );
};
var boletas_default = BoletasTable;
var RiskBadge = ({ value, thresholds }) => {
  if (value === null || value === void 0) return null;
  let badgeClass = "bg-status-ok/15 text-status-ok";
  let badgeText = "OK";
  if (value >= thresholds.danger) {
    badgeClass = "bg-status-pending/15 text-status-pending";
    badgeText = "Alto";
  } else if (value >= thresholds.warning) {
    badgeClass = "bg-status-warn/15 text-status-warn";
    badgeText = "Medio";
  }
  return /* @__PURE__ */ jsx("span", { className: `text-xs font-medium px-1.5 py-0.5 rounded ${badgeClass}`, children: badgeText });
};
var FinalResultsCompact = ({
  values,
  onChange,
  calculatedDebtorIncome = 0,
  calculatedCodebtorIncome = 0,
  codeudorIncomes = [],
  calculatedDebts = 0,
  prompt
}) => {
  const debtorIncome = values.renta_liquida_ajustada_comprador ?? (calculatedDebtorIncome > 0 ? Math.round(calculatedDebtorIncome) : null);
  const hasMultipleCodes = codeudorIncomes.length > 0;
  const codeudorIncomesAdjusted = hasMultipleCodes ? codeudorIncomes.map((c, idx) => values.rentas_codeudores?.[idx] ?? (c.calculatedIncome > 0 ? Math.round(c.calculatedIncome) : null)) : [values.renta_liquida_ajustada_codeudor ?? (calculatedCodebtorIncome > 0 ? Math.round(calculatedCodebtorIncome) : null)];
  const totalCodeudorIncome = codeudorIncomesAdjusted.reduce((sum, v) => sum + (v ?? 0), 0);
  const calculatedTotal = (debtorIncome ?? 0) + totalCodeudorIncome;
  const displayTotal = values.total_rentas ?? calculatedTotal;
  const dividendo = values.dividendo_hipotecario ?? 0;
  const totalDebts = calculatedDebts;
  const autoCalculatedCH = displayTotal > 0 ? Math.round(dividendo / displayTotal * 1e4) / 100 : 0;
  const autoCalculatedCF = displayTotal > 0 ? Math.round((dividendo + totalDebts) / displayTotal * 1e4) / 100 : 0;
  const displayCH = values.indice_carga_hipotecaria ?? (autoCalculatedCH > 0 ? autoCalculatedCH : null);
  const displayCF = values.indice_carga_financiera_conjunta ?? (autoCalculatedCF > 0 ? autoCalculatedCF : null);
  const handleEditCH = prompt ? async () => {
    const newVal = await prompt({ message: "Carga Hipotecaria (%)", title: "Editar \xEDndice", defaultValue: displayCH?.toString() || "", type: "number", icon: "Percent" });
    if (newVal !== null) {
      const parsed = parseFloat(newVal);
      onChange("indice_carga_hipotecaria", isNaN(parsed) ? null : parsed);
    }
  } : void 0;
  const handleEditCF = prompt ? async () => {
    const newVal = await prompt({ message: "Carga Financiera Total (%)", title: "Editar \xEDndice", defaultValue: displayCF?.toString() || "", type: "number", icon: "Percent" });
    if (newVal !== null) {
      const parsed = parseFloat(newVal);
      onChange("indice_carga_financiera_conjunta", isNaN(parsed) ? null : parsed);
    }
  } : void 0;
  const clickableClass = prompt ? "cursor-pointer hover:underline" : "";
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-status-ok/10 rounded-xl p-4 border border-status-ok/30", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-status-ok uppercase tracking-wider mb-3 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }),
        "Rentas L\xEDquidas"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: T.muted, children: "Comprador" }),
          /* @__PURE__ */ jsx(
            editablecell_default,
            {
              value: debtorIncome,
              onChange: (v) => {
                onChange("renta_liquida_ajustada_comprador", v);
                const newTotal = (v ?? 0) + totalCodeudorIncome;
                onChange("total_rentas", newTotal > 0 ? newTotal : null);
              },
              type: "currency",
              className: `text-status-ok ${T.cardValue}`,
              asDiv: true
            }
          )
        ] }),
        hasMultipleCodes ? codeudorIncomes.map((codeudor, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: `${T.muted} truncate max-w-[120px]`, title: codeudor.name, children: codeudorIncomes.length > 1 ? `Codeudor ${idx + 1}` : "Codeudor" }),
          /* @__PURE__ */ jsx(
            editablecell_default,
            {
              value: codeudorIncomesAdjusted[idx],
              onChange: (v) => {
                const newCodeudorIncomes = [...codeudorIncomesAdjusted];
                newCodeudorIncomes[idx] = v;
                onChange("rentas_codeudores", newCodeudorIncomes);
                const newTotal = (debtorIncome ?? 0) + newCodeudorIncomes.reduce((sum, val) => sum + (val ?? 0), 0);
                onChange("total_rentas", newTotal > 0 ? newTotal : null);
              },
              type: "currency",
              className: `text-status-ok ${T.cardValue}`,
              asDiv: true
            }
          )
        ] }, idx)) : /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: T.muted, children: "Codeudor" }),
          /* @__PURE__ */ jsx(
            editablecell_default,
            {
              value: codeudorIncomesAdjusted[0],
              onChange: (v) => {
                onChange("renta_liquida_ajustada_codeudor", v);
                const newTotal = (debtorIncome ?? 0) + (v ?? 0);
                onChange("total_rentas", newTotal > 0 ? newTotal : null);
              },
              type: "currency",
              className: `text-status-ok ${T.cardValue}`,
              asDiv: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-t border-status-ok/40 pt-2 mt-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: `${T.footerLabel} text-status-ok text-xs`, children: "TOTAL" }),
          /* @__PURE__ */ jsx("span", { className: `text-status-ok ${T.footerValue}`, children: displayCurrencyCompact(displayTotal > 0 ? displayTotal : null) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-brand/10 rounded-xl p-4 border border-brand/30", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-brand uppercase tracking-wider mb-3 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" }) }),
        "Obligaciones"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: T.muted, children: "Dividendo" }),
          /* @__PURE__ */ jsx(
            editablecell_default,
            {
              value: values.dividendo_hipotecario,
              onChange: (v) => onChange("dividendo_hipotecario", v),
              type: "currency",
              className: `text-brand ${T.cardValue}`,
              asDiv: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: T.muted, children: "Deudas" }),
          /* @__PURE__ */ jsx("span", { className: `text-status-late ${T.cardValue}`, children: displayCurrencyCompact(totalDebts > 0 ? totalDebts : null) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-t border-brand/40 pt-2 mt-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: `${T.footerLabel} text-brand text-xs`, children: "TOTAL" }),
          /* @__PURE__ */ jsx("span", { className: `text-brand ${T.footerValue}`, children: displayCurrencyCompact(dividendo + totalDebts > 0 ? dividendo + totalDebts : null) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-status-info/10 rounded-xl p-4 border border-status-info/30", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-status-info uppercase tracking-wider mb-3 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }),
        "\xCDndices de Carga"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: T.muted, children: "Hipotecaria" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `text-status-info ${T.cardValue} ${clickableClass}`,
                onClick: handleEditCH,
                children: displayCH !== null && displayCH !== void 0 ? `${displayCH}%` : "\u2014"
              }
            ),
            /* @__PURE__ */ jsx(RiskBadge, { value: displayCH, thresholds: { warning: 25, danger: 35 } })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: T.muted, children: "Financiera" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `text-status-info ${T.cardValue} ${clickableClass}`,
                onClick: handleEditCF,
                children: displayCF !== null && displayCF !== void 0 ? `${displayCF}%` : "\u2014"
              }
            ),
            /* @__PURE__ */ jsx(RiskBadge, { value: displayCF, thresholds: { warning: 40, danger: 50 } })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var finalresults_default = FinalResultsCompact;
function EditableField({
  value,
  onChange,
  displayValue,
  defaultValue,
  type = "number",
  min = 0,
  max = 100,
  symbol = "\xD7",
  originClass,
  width,
  className = "",
  keyboard,
  rowId,
  cellKey
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const committingRef = useRef(false);
  const useRegistry = !!(keyboard && rowId && cellKey);
  const register = keyboard?.register;
  useEffect(() => {
    if (!useRegistry || !register) return;
    return register({
      rowId,
      cellKey,
      ref: wrapperRef
    });
  }, [useRegistry, register, rowId, cellKey]);
  useRegistry ? keyboard.isFocused(rowId, cellKey) : false;
  const editRequest = useRegistry ? keyboard.editRequest : null;
  const editRequestForMe = useRegistry && editRequest && editRequest.rowId === rowId && editRequest.cellKey === cellKey ? editRequest : null;
  const hidden = defaultValue != null && value === defaultValue;
  const startEdit = (initialValue) => {
    committingRef.current = false;
    setEditValue(initialValue ?? value?.toString() ?? "");
    setIsEditing(true);
  };
  useEffect(() => {
    if (editRequestForMe && !isEditing) {
      startEdit(editRequestForMe.initialValue ?? void 0);
    }
  }, [editRequestForMe?.n]);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (editValue.length <= 1) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      } else {
        inputRef.current.select();
      }
    }
  }, [isEditing]);
  const commitEdit = () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const inputStillFocused = document.activeElement === inputRef.current;
    setIsEditing(false);
    const parsed = type === "percent" ? parseFloat(editValue) : parseInt(editValue, 10);
    if (editValue !== "" && !isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, Math.round(parsed)));
      if (clamped !== value) onChange(clamped);
    }
    if (useRegistry && inputStillFocused) {
      wrapperRef.current?.focus();
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
      if (useRegistry) keyboard.navigate("down");
    } else if (e.key === "Tab") {
      if (useRegistry) {
        e.preventDefault();
        commitEdit();
        keyboard.navigate(e.shiftKey ? "left" : "right");
      }
    } else if (e.key === "Escape") {
      committingRef.current = true;
      setIsEditing(false);
    }
  };
  const handleClick = () => {
    if (!isEditing) {
      if (useRegistry) keyboard.focus(rowId, cellKey);
      startEdit();
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: useRegistry ? wrapperRef : void 0,
      tabIndex: useRegistry ? 0 : void 0,
      className: `group/field flex items-center gap-1.5 rounded-md cursor-pointer
                hover:bg-surface-1/60 transition-colors ${useRegistry ? "outline-none" : ""} ${className}`,
      style: width ? { width } : void 0,
      onClick: handleClick,
      onFocus: useRegistry ? () => keyboard.focus(rowId, cellKey) : void 0,
      children: [
        /* @__PURE__ */ jsxs("div", { className: `
                shrink-0 relative inline-flex items-center gap-0.5 justify-center
                bg-blue-50/50 rounded-md py-0 px-1.5 h-5 text-xs min-w-[48px] text-center
                transition-opacity
                ${hidden ? "opacity-30 group-hover/field:opacity-60 group-focus-within/field:!opacity-100" : ""}
            `, children: [
          isEditing && /* @__PURE__ */ jsx(
            "input",
            {
              ref: inputRef,
              type: "text",
              inputMode: "numeric",
              value: editValue,
              onChange: (e) => setEditValue(e.target.value),
              onBlur: commitEdit,
              onKeyDown: handleKeyDown,
              className: "absolute inset-0 rounded-md text-center text-xs tabular-nums text-ink-primary bg-transparent border-none outline-none ring-0 shadow-none px-1.5 z-10",
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: `tabular-nums ${isEditing ? "invisible" : ""} text-ink-primary`, children: value?.toString() ?? "\u2014" }),
          symbol && /* @__PURE__ */ jsx("span", { className: `text-ink-primary ${isEditing ? "invisible" : ""}`, children: symbol })
        ] }),
        displayValue != null && /* @__PURE__ */ jsx("span", { className: `text-xs tabular-nums whitespace-nowrap ml-auto text-ink-secondary ${originClass ?? ""}`, children: displayValue })
      ]
    }
  );
}

// src/common/autoconvert.ts
function buildUfPair(ufKey, pesosKey, ufValue, ufPrecision = 2, pesosPrecision = 0) {
  return [
    { source: ufKey, target: pesosKey, formula: (v) => v * ufValue, precision: pesosPrecision },
    { source: pesosKey, target: ufKey, formula: (v) => v / ufValue, precision: ufPrecision }
  ];
}
function applyAutoConversions(row, editedField, editedValue, rules, params) {
  let result = { ...row, [editedField]: editedValue };
  for (const rule of rules) {
    if (rule.source === editedField && typeof editedValue === "number") {
      const precision = rule.precision ?? 0;
      const converted = rule.formula(editedValue, params);
      result[rule.target] = precision === 0 ? Math.round(converted) : Math.round(converted * Math.pow(10, precision)) / Math.pow(10, precision);
    }
  }
  return result;
}
function applyAutoCompute(row, editedField, rules, params) {
  let result = { ...row };
  for (const rule of rules) {
    if (rule.depends.includes(editedField)) {
      if (!rule.condition || rule.condition(result)) {
        result[rule.target] = rule.formula(result, params);
      }
    }
  }
  return result;
}
function useSoftDelete(rows, onRowsChange) {
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const activeRows = useMemo(() => rows.filter((r) => !r.deletedAt), [rows]);
  const deletedRows = useMemo(() => rows.filter((r) => !!r.deletedAt), [rows]);
  const requestDelete = useCallback((id) => {
    setDeleteTargetId(id);
  }, []);
  const confirmDelete = useCallback((reason) => {
    if (!deleteTargetId) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    onRowsChange(rows.map(
      (r) => r.id === deleteTargetId ? { ...r, deletedAt: now, deletionReason: reason || void 0 } : r
    ));
    setDeleteTargetId(null);
  }, [deleteTargetId, rows, onRowsChange]);
  const cancelDelete = useCallback(() => {
    setDeleteTargetId(null);
  }, []);
  const restoreRow = useCallback((id) => {
    onRowsChange(rows.map((r) => {
      if (r.id !== id) return r;
      const { deletedAt: _, deletionReason: __, ...rest } = r;
      return rest;
    }));
  }, [rows, onRowsChange]);
  return { activeRows, deletedRows, deleteTargetId, requestDelete, confirmDelete, cancelDelete, restoreRow };
}
var useDragReorder2 = () => {
  const [dragRowId, setDragRowId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const handleDragStart = useCallback((rowId) => (e) => {
    setDragRowId(rowId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", rowId);
  }, []);
  const handleDragOver = useCallback((rowId) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (rowId === dragRowId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropTargetId(rowId);
    setDropPosition(e.clientY < midY ? "above" : "below");
  }, [dragRowId]);
  const handleDrop = useCallback((rows, onRowsChange) => (e) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || !dropTargetId || sourceId === dropTargetId) {
      resetState();
      return;
    }
    const sourceIdx = rows.findIndex((r) => r.id === sourceId);
    const targetIdx = rows.findIndex((r) => r.id === dropTargetId);
    if (sourceIdx === -1 || targetIdx === -1) {
      resetState();
      return;
    }
    const result = rows.filter((r) => r.id !== sourceId);
    const insertIdx = dropPosition === "below" ? result.findIndex((r) => r.id === dropTargetId) + 1 : result.findIndex((r) => r.id === dropTargetId);
    result.splice(insertIdx, 0, rows[sourceIdx]);
    onRowsChange(result);
    resetState();
  }, [dropTargetId, dropPosition]);
  const handleDragEnd = useCallback(() => {
    resetState();
  }, []);
  function resetState() {
    setDragRowId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }
  return {
    dragRowId,
    dropTargetId,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragLeave: useCallback(() => {
      setDropTargetId(null);
      setDropPosition(null);
    }, []),
    handleDrop,
    handleDragEnd
  };
};

// src/common/cellorigin.ts
var ORIGIN_CLASSES = {
  ai: "text-ink-tertiary",
  user: "text-ink-primary",
  calculated: "text-status-info"
};
var ADD_ROW_ID = "__add__";
function AssetTable({
  columns,
  rows,
  onRowsChange,
  idPrefix,
  addPlaceholder,
  formatCurrency = defaultFormatCurrency,
  colorScheme: colorSchemeProp,
  headerBg: headerBgProp,
  headerText: headerTextProp,
  title,
  ufValue,
  conversionRules = [],
  computeRules = [],
  sideEffects = [],
  onViewSource,
  getCellOriginClass,
  selectable = false,
  reorderable = false
}) {
  const { bg: headerBg, text: headerText, border: borderColor } = resolveColors(colorSchemeProp, headerBgProp, headerTextProp);
  const { getHoverProps, isHovered } = useRowHover();
  const [toggledCols, setToggledCols] = useState(/* @__PURE__ */ new Set());
  const { activeRows, deletedRows, deleteTargetId, requestDelete, confirmDelete, cancelDelete, restoreRow } = useSoftDelete(rows, onRowsChange);
  const [selectedRows, setSelectedRows] = useState(/* @__PURE__ */ new Set());
  const [newRowValues, setNewRowValues] = useState({});
  const drag = useDragReorder2();
  const anySelected = selectable && selectedRows.size > 0;
  const canToggleCurrency = ufValue != null;
  const hasAutoConvert = conversionRules.length > 0 || computeRules.length > 0 || sideEffects.length > 0;
  const toggleColumn = (key) => {
    setToggledCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const resolvedColumns = useMemo(() => {
    return columns.map((col) => {
      if (col.ufPair && toggledCols.has(col.key)) {
        const pairLabel = col.ufPairLabel || col.label;
        const pairType = col.ufPairType || "currency";
        return { ...col, key: col.ufPair, type: pairType, label: pairLabel };
      }
      return col;
    });
  }, [columns, toggledCols]);
  const visibleRowIds = useMemo(
    () => [...activeRows.map((r) => r.id), ADD_ROW_ID],
    [activeRows]
  );
  const keyboard = useGridKeyboard({ visibleRowIds });
  const labelCol = resolvedColumns.find((c) => c.isLabel) || resolvedColumns[0];
  const toggleSelect = useCallback((rowId) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedRows(/* @__PURE__ */ new Set()), []);
  const requestDeleteSelected = useCallback(() => {
    for (const id of selectedRows) requestDelete(id);
    clearSelection();
  }, [selectedRows, requestDelete, clearSelection]);
  const handleRowClick = useCallback((e, rowId) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const target = e.target;
    if (target.closest('input, button, [role="button"]')) return;
    e.preventDefault();
    toggleSelect(rowId);
  }, [toggleSelect]);
  const updateField = (id, field, value) => {
    onRowsChange(rows.map((r) => {
      if (r.id !== id) return r;
      if (hasAutoConvert) {
        let next = applyAutoConversions(r, field, value, conversionRules, {});
        next = applyAutoCompute(next, field, computeRules, {});
        for (const effect of sideEffects) {
          if (effect.trigger === field) {
            next = { ...next, ...effect.apply(next, value) };
          }
        }
        return next;
      }
      return { ...r, [field]: value };
    }));
  };
  const addRow = (overrides) => {
    const base = { id: generateId(idPrefix) };
    for (const col of columns) {
      if (col.type === "text") {
        base[col.key] = (newRowValues[col.key] || "").trim();
      } else {
        base[col.key] = null;
      }
      if (col.ufPair) base[col.ufPair] = null;
      if (col.compound) base[col.compound.key] = null;
    }
    const row = { ...base, ...overrides };
    setNewRowValues({});
    onRowsChange([...rows, row]);
  };
  const totals = useMemo(() => {
    const result = {};
    for (const col of resolvedColumns) {
      if (col.type === "currency" || col.type === "number") {
        result[col.key] = activeRows.reduce((s, r) => s + (r[col.key] || 0), 0);
      }
      if (col.compound) {
        result[col.compound.key] = activeRows.reduce((s, r) => s + (r[col.compound.key] || 0), 0);
      }
    }
    return result;
  }, [activeRows, resolvedColumns]);
  const cellOrigin = (row, key, col) => {
    if (col.autoComputedClass?.(row)) return ORIGIN_CLASSES.calculated;
    return getCellOriginClass?.(row.id, key);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { onKeyDown: keyboard.handleContainerKeyDown, tabIndex: 0, className: "outline-none mb-4 sm:mb-6", children: /* @__PURE__ */ jsxs(
      tableshell_default,
      {
        colorScheme: colorSchemeProp,
        headerClassName: `border-t ${borderColor} ${headerText}`,
        rowCount: activeRows.length,
        renderHeader: () => anySelected ? /* @__PURE__ */ jsx("th", { colSpan: resolvedColumns.length + 1, className: `${T.headerCell} text-left`, onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-status-pending", children: [
            selectedRows.size,
            " fila",
            selectedRows.size !== 1 ? "s" : ""
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: requestDeleteSelected,
              className: "text-xs px-3 py-1 rounded-full text-status-pending hover:bg-status-pending/15 transition-colors flex items-center gap-1",
              title: "Eliminar filas seleccionadas",
              children: [
                /* @__PURE__ */ jsx(Trash2, { size: 12 }),
                "Eliminar"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: clearSelection,
              className: "text-xs px-2 py-1 rounded-full text-ink-tertiary hover:bg-surface-2 transition-colors",
              children: "Cancelar"
            }
          )
        ] }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          resolvedColumns.map((col, i) => {
            const isNumeric = col.type === "currency" || col.type === "number";
            const effectiveAlign = col.align ?? (isNumeric ? "right" : col.type === "percent" ? "center" : "left");
            const vline = i < resolvedColumns.length - 1 ? T.vline : "";
            const label = col === labelCol && title ? title : col.label;
            const origCol = columns[i];
            const isToggleable = canToggleCurrency && origCol?.ufPair;
            return /* @__PURE__ */ jsx(
              "th",
              {
                style: col.width ? { width: col.width } : void 0,
                className: `${T.headerCell} ${effectiveAlign === "right" ? "text-right" : effectiveAlign === "center" ? "text-center" : "text-left"} ${T.th} normal-case ${headerText} ${vline}`,
                children: isToggleable ? /* @__PURE__ */ jsx(clickableheader_default, { onClick: () => toggleColumn(origCol.key), borderColor, children: label }) : label
              },
              col.key
            );
          }),
          /* @__PURE__ */ jsx("th", { className: T.actionCol })
        ] }),
        renderFooter: () => /* @__PURE__ */ jsxs("tr", { className: "font-semibold text-xs text-ink-tertiary", children: [
          resolvedColumns.map((col) => {
            if (col.isLabel) {
              return /* @__PURE__ */ jsx("td", { className: `${T.totalCell} ${T.totalLabel} border-t border-edge-subtle/10`, children: "TOTAL" }, col.key);
            }
            if (col.type === "text") {
              return /* @__PURE__ */ jsx("td", { className: `${T.totalCell} border-t border-edge-subtle/10` }, col.key);
            }
            if (col.type === "percent") {
              return /* @__PURE__ */ jsx("td", { className: "border-t border-edge-subtle/10" }, col.key);
            }
            if (col.compound) {
              const sep = col.compound.separator ?? "/";
              const v1 = totals[col.key];
              const v2 = totals[col.compound.key];
              return /* @__PURE__ */ jsx("td", { className: `${T.totalCell} text-center ${T.totalValue} border-t border-edge-subtle/10`, children: v1 || v2 ? `${v1 || 0} ${sep} ${v2 || 0}` : "" }, col.key);
            }
            return /* @__PURE__ */ jsx("td", { className: `${T.totalCell} ${col.align === "center" ? "text-center" : "text-right"} ${T.totalValue} border-t border-edge-subtle/10`, children: totals[col.key] ? col.type === "number" ? totals[col.key].toLocaleString("es-CL", { maximumFractionDigits: 2 }) : formatCurrency(totals[col.key]) : "" }, col.key);
          }),
          /* @__PURE__ */ jsx("td", { className: "border-t border-edge-subtle/10" })
        ] }),
        renderAfterContent: () => /* @__PURE__ */ jsx(
          recyclebin_default,
          {
            deletedRows,
            getLabel: (r) => r[labelCol.key] || "",
            onRestore: restoreRow,
            renderCells: (row) => {
              const editableCols = resolvedColumns.filter((c) => c.type !== "text");
              return /* @__PURE__ */ jsxs(Fragment, { children: [
                editableCols.map((col, i) => {
                  if (col.compound) {
                    const sep = col.compound.separator ?? "/";
                    const v1 = row[col.key];
                    const v2 = row[col.compound.key];
                    return /* @__PURE__ */ jsx("td", { className: `${T.totalCell} text-center tabular-nums ${i < editableCols.length - 1 ? T.vline : ""}`, children: /* @__PURE__ */ jsx("span", { className: `${T.totalValue} ${v1 != null || v2 != null ? "text-ink-tertiary" : "text-ink-tertiary/40"}`, children: v1 != null || v2 != null ? `${v1 ?? "\u2014"} ${sep} ${v2 ?? "\u2014"}` : "\u2014" }) }, col.key);
                  }
                  const v = row[col.key];
                  return /* @__PURE__ */ jsx("td", { className: `${T.totalCell} text-right tabular-nums ${i < editableCols.length - 1 ? T.vline : ""}`, children: /* @__PURE__ */ jsx("span", { className: `${T.totalValue} ${v != null ? "text-ink-tertiary" : "text-ink-tertiary/40"}`, children: v != null ? col.type === "number" ? String(v) : col.type === "percent" ? `${Math.round(v * 100)}%` : formatCurrency(v) : "\u2014" }) }, col.key);
                }),
                /* @__PURE__ */ jsx("td", { className: T.actionCol })
              ] });
            }
          }
        ),
        children: [
          activeRows.map((row) => {
            const hovered = isHovered(row.id);
            const selected = selectable && selectedRows.has(row.id);
            const isDragging = reorderable && drag.dragRowId === row.id;
            const dropBorder = reorderable && drag.dropTargetId === row.id ? drag.dropPosition === "above" ? "border-t-2 border-t-brand" : "border-b-2 border-b-brand" : "";
            return /* @__PURE__ */ jsxs(
              "tr",
              {
                className: `${T.rowBorder} ${selected ? "bg-status-pending/10" : T.rowHover} ${isDragging ? "opacity-40" : ""} ${dropBorder}`,
                ...getHoverProps(row.id),
                onClick: selectable ? (e) => handleRowClick(e, row.id) : void 0,
                onDragOver: reorderable ? drag.handleDragOver(row.id) : void 0,
                onDragLeave: reorderable ? drag.handleDragLeave : void 0,
                onDrop: reorderable ? drag.handleDrop(rows, onRowsChange) : void 0,
                children: [
                  resolvedColumns.map((col, i) => {
                    const vline = i < resolvedColumns.length - 1 ? T.vline : "";
                    if (col.isLabel) {
                      return /* @__PURE__ */ jsxs("td", { className: `${T.cellEditLabel} ${T.cellLabel} ${vline} relative`, children: [
                        /* @__PURE__ */ jsx(
                          rowtoolbar_default,
                          {
                            hovered,
                            anySelected,
                            selected,
                            reorderable,
                            onDragStart: reorderable ? drag.handleDragStart(row.id) : void 0,
                            onDragEnd: reorderable ? drag.handleDragEnd : void 0,
                            selectable,
                            onToggleSelect: selectable ? () => toggleSelect(row.id) : void 0,
                            onDelete: () => requestDelete(row.id),
                            sourceFileId: row.sourceFileId,
                            onViewSource
                          }
                        ),
                        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5 min-w-0", children: /* @__PURE__ */ jsx(
                          gridtextinput_default,
                          {
                            keyboard,
                            rowId: row.id,
                            cellKey: col.key,
                            value: row[col.key] || "",
                            onChange: (v) => updateField(row.id, col.key, v),
                            className: `flex-1 min-w-0 ${T.inputLabel} !p-0 ${getCellOriginClass?.(row.id, col.key) || ""}`,
                            placeholder: col.placeholder || col.label
                          }
                        ) })
                      ] }, col.key);
                    }
                    if (col.type === "text") {
                      if (col.visible && !col.visible(row)) {
                        return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} text-center ${vline}`, children: /* @__PURE__ */ jsx("span", { className: "text-[11px] text-ink-tertiary/60", children: "\u2014" }) }, col.key);
                      }
                      if (col.readOnly?.(row)) {
                        const v = row[col.key] || "";
                        return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${vline}`, children: /* @__PURE__ */ jsx("div", { className: `text-xs ${getCellOriginClass?.(row.id, col.key) || "text-ink-primary"}`, children: v || "\u2014" }) }, col.key);
                      }
                      const isRight = col.align === "right";
                      const isCenter = col.align === "center";
                      const textAlign = isRight ? "text-right" : isCenter ? "text-center" : "text-left";
                      return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${vline}`, children: /* @__PURE__ */ jsx(
                        gridtextinput_default,
                        {
                          keyboard,
                          rowId: row.id,
                          cellKey: col.key,
                          value: row[col.key] || "",
                          onChange: (v) => updateField(row.id, col.key, v),
                          className: `w-full ${T.input} ${textAlign} ${!isRight && !isCenter ? "pl-1" : ""} ${getCellOriginClass?.(row.id, col.key) || ""}`,
                          style: isRight || isCenter ? { padding: 0 } : void 0,
                          placeholder: col.placeholder || col.label
                        }
                      ) }, col.key);
                    }
                    if (col.visible && !col.visible(row)) {
                      return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} text-center ${vline}`, children: /* @__PURE__ */ jsx("span", { className: "text-[11px] text-ink-tertiary/60", children: "\u2014" }) }, col.key);
                    }
                    if (col.readOnly?.(row)) {
                      const v = row[col.key];
                      const isNumeric = col.type === "currency" || col.type === "number";
                      const effectiveAlign = col.align ?? (isNumeric ? "right" : "center");
                      const alignCls = effectiveAlign === "left" ? "justify-start" : effectiveAlign === "center" ? "justify-center" : "justify-end";
                      const displayStr = v != null ? col.type === "number" ? String(v) : formatCurrency(v) : "\u2014";
                      if (col.field && v != null) {
                        const f = col.field;
                        return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${vline}`, children: /* @__PURE__ */ jsx(
                          EditableField,
                          {
                            value: row[f.key],
                            onChange: (v2) => updateField(row.id, f.key, v2),
                            displayValue: displayStr,
                            defaultValue: f.defaultValue,
                            symbol: f.symbol ?? "\xD7",
                            min: f.min ?? 0,
                            max: f.max ?? 99,
                            originClass: cellOrigin(row, f.key, col),
                            className: alignCls,
                            keyboard,
                            rowId: row.id,
                            cellKey: f.key
                          }
                        ) }, col.key);
                      }
                      return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${vline}`, children: /* @__PURE__ */ jsx("div", { className: `h-5 flex items-center ${alignCls} text-xs tabular-nums text-ink-primary`, children: displayStr }) }, col.key);
                    }
                    if (col.compound) {
                      const sep = col.compound.separator ?? "/";
                      return /* @__PURE__ */ jsx("td", { className: `text-center text-xs text-ink-tertiary ${vline}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-0.5", children: [
                        /* @__PURE__ */ jsx(
                          editablecell_default,
                          {
                            value: row[col.key],
                            onChange: (v) => updateField(row.id, col.key, v),
                            type: col.type,
                            hasData: row[col.key] !== null,
                            align: "center",
                            originClass: cellOrigin(row, col.key, col),
                            asDiv: true,
                            keyboard,
                            rowId: row.id,
                            cellKey: col.key
                          }
                        ),
                        /* @__PURE__ */ jsx("span", { className: "text-ink-tertiary", children: sep }),
                        /* @__PURE__ */ jsx(
                          editablecell_default,
                          {
                            value: row[col.compound.key],
                            onChange: (v) => updateField(row.id, col.compound.key, v),
                            type: col.type,
                            hasData: row[col.compound.key] !== null,
                            align: "center",
                            originClass: cellOrigin(row, col.compound.key, col),
                            asDiv: true,
                            keyboard,
                            rowId: row.id,
                            cellKey: col.compound.key
                          }
                        )
                      ] }) }, col.key);
                    }
                    if (col.type === "percent") {
                      const rawValue = row[col.key];
                      const displayValue = rawValue != null ? Math.round(rawValue * 100) : null;
                      return /* @__PURE__ */ jsx(
                        editablecell_default,
                        {
                          value: displayValue,
                          onChange: (v) => updateField(row.id, col.key, v != null ? v / 100 : null),
                          type: "percent",
                          hasData: displayValue !== null,
                          align: col.align || "center",
                          className: vline,
                          originClass: cellOrigin(row, col.key, col),
                          keyboard,
                          rowId: row.id,
                          cellKey: col.key
                        },
                        col.key
                      );
                    }
                    const value = row[col.key];
                    const cellSourceFileId = col.sourceFileIdKey ? row[col.sourceFileIdKey] : void 0;
                    const cellViewSource = cellSourceFileId && onViewSource ? () => onViewSource([cellSourceFileId]) : void 0;
                    const tip = col.tooltip?.(row);
                    if (tip) {
                      return /* @__PURE__ */ jsx("td", { className: vline, title: tip, children: /* @__PURE__ */ jsx(
                        editablecell_default,
                        {
                          value,
                          onChange: (v) => updateField(row.id, col.key, v),
                          type: col.type,
                          hasData: value !== null,
                          align: col.align,
                          originClass: cellOrigin(row, col.key, col),
                          onViewSource: cellViewSource,
                          asDiv: true,
                          keyboard,
                          rowId: row.id,
                          cellKey: col.key
                        }
                      ) }, col.key);
                    }
                    return /* @__PURE__ */ jsx(
                      editablecell_default,
                      {
                        value,
                        onChange: (v) => updateField(row.id, col.key, v),
                        type: col.type,
                        hasData: value !== null,
                        align: col.align,
                        className: vline,
                        originClass: cellOrigin(row, col.key, col),
                        onViewSource: cellViewSource,
                        keyboard,
                        rowId: row.id,
                        cellKey: col.key
                      },
                      col.key
                    );
                  }),
                  /* @__PURE__ */ jsx("td", { className: T.actionCol, "aria-hidden": true })
                ]
              },
              row.id
            );
          }),
          /* @__PURE__ */ jsxs("tr", { className: `border-b border-dashed ${borderColor.replace("200", "100")} ${headerBg}/20`, children: [
            resolvedColumns.map((col, i) => {
              const vline = i < resolvedColumns.length - 1 ? T.vline : "";
              if (col.isLabel) {
                return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${vline}`, children: /* @__PURE__ */ jsx(
                  gridtextinput_default,
                  {
                    keyboard,
                    rowId: ADD_ROW_ID,
                    cellKey: col.key,
                    value: newRowValues[col.key] || "",
                    onChange: (v) => setNewRowValues((prev) => ({ ...prev, [col.key]: v })),
                    placeholder: addPlaceholder || `Agregar...`,
                    className: `w-full ${T.inputPlaceholder}`,
                    onEnter: () => {
                      if ((newRowValues[col.key] || "").trim()) addRow();
                    }
                  }
                ) }, col.key);
              }
              if (col.type === "text") {
                const isAddRight = col.align === "right";
                const isAddCenter = col.align === "center";
                const addTextAlign = isAddRight ? "text-right" : isAddCenter ? "text-center" : "text-left";
                return /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${vline}`, children: /* @__PURE__ */ jsx(
                  gridtextinput_default,
                  {
                    keyboard,
                    rowId: ADD_ROW_ID,
                    cellKey: col.key,
                    value: newRowValues[col.key] || "",
                    onChange: (v) => setNewRowValues((prev) => ({ ...prev, [col.key]: v })),
                    placeholder: col.placeholder || col.label,
                    className: `w-full ${T.inputPlaceholder} ${addTextAlign}`,
                    style: isAddRight || isAddCenter ? { padding: 0 } : void 0
                  }
                ) }, col.key);
              }
              if (col.compound || col.type === "percent") {
                return /* @__PURE__ */ jsx("td", { className: vline }, col.key);
              }
              return /* @__PURE__ */ jsx(
                editablecell_default,
                {
                  value: null,
                  onChange: (v) => addRow({ [col.key]: v }),
                  type: col.type,
                  hasData: false,
                  align: col.align,
                  className: vline,
                  keyboard,
                  rowId: ADD_ROW_ID,
                  cellKey: col.key
                },
                col.key
              );
            }),
            /* @__PURE__ */ jsx("td", { className: T.actionCol })
          ] })
        ]
      }
    ) }),
    deleteTargetId && /* @__PURE__ */ jsx(deletedialog_default, { count: 1, onConfirm: confirmDelete, onCancel: cancelDelete })
  ] });
}
var assettable_default = AssetTable;
var defaultColorScheme = {
  totalBg: "bg-status-info/10",
  totalBorder: "border-status-info/30",
  totalText: "text-status-info",
  totalValueText: "text-status-info"
};
var ActivosSummary = ({
  items,
  totalLabel = "Total Activos",
  formatCurrency = defaultFormatCurrency,
  colorScheme = defaultColorScheme
}) => {
  const grandTotal = items.reduce((sum, item) => sum + (item.value || 0), 0);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "border border-edge-subtle/20 rounded-lg p-2.5", children: [
      /* @__PURE__ */ jsx("div", { className: `${T.cardLabel} text-ink-tertiary`, children: item.label }),
      /* @__PURE__ */ jsx("div", { className: `${T.cardValue} text-ink-primary mt-0.5`, children: item.value ? formatCurrency(item.value) : "\u2014" }),
      /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-ink-tertiary/70 mt-0.5", children: [
        item.count,
        " ",
        item.count === 1 ? "registro" : "registros"
      ] })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: `${colorScheme.totalBg} border ${colorScheme.totalBorder} rounded-lg p-2.5 flex items-center justify-between`, children: [
      /* @__PURE__ */ jsx("span", { className: `${T.totalLabel} ${colorScheme.totalText}`, children: totalLabel }),
      /* @__PURE__ */ jsx("span", { className: `${T.totalValue} ${colorScheme.totalValueText}`, children: grandTotal ? formatCurrency(grandTotal) : "\u2014" })
    ] })
  ] });
};
var activossummary_default = ActivosSummary;
function formatCell(v, format) {
  if (v == null) return { display: "\u2014", title: void 0 };
  switch (format) {
    case "percent": {
      const pct = v * 100;
      const display = pct.toFixed(2).replace(".", ",") + " %";
      const full = pct.toFixed(4).replace(".", ",") + " %";
      return { display, title: full !== display ? full : void 0 };
    }
    case "integer":
      return { display: String(Math.round(v)), title: void 0 };
    default:
      return { display: displayCurrencyCompact(v), title: displayCurrency(v) || void 0 };
  }
}
var SummaryTable = ({ columnHeaders, rows, extraColumn, renderLabelSuffix, colorScheme, getCellOriginClass, renderCell }) => {
  const colors = colorScheme ?? DEFAULT_SCHEME;
  return /* @__PURE__ */ jsx("div", { className: "overflow-x-auto border-y border-edge-subtle/20 mb-3 sm:mb-4", children: /* @__PURE__ */ jsx("table", { className: `${T.table} border-collapse`, children: /* @__PURE__ */ jsx("tbody", { children: rows.map((row, idx) => {
    if (row.type === "subheader") {
      return /* @__PURE__ */ jsxs("tr", { className: `border-b-2 ${colors.bg} ${colors.border}`, children: [
        /* @__PURE__ */ jsx("td", { className: `${T.cell} ${T.th} font-bold ${colors.text} tracking-wider ${T.vline}`, children: row.label }),
        extraColumn && /* @__PURE__ */ jsx("td", { className: `${T.cell} ${T.th} text-right font-bold ${colors.text} ${T.vline}`, children: extraColumn.header }),
        columnHeaders.map((col, i) => /* @__PURE__ */ jsx("td", { className: `${T.cell} ${T.th} text-right font-bold ${colors.text} ${i < columnHeaders.length - 1 ? T.vline : ""}`, children: col }, i))
      ] }, idx);
    }
    const isTotal = row.type === "total";
    const isFinal = row.type === "grandtotal";
    const bold = isTotal || isFinal;
    const fmt = row.format ?? "currency";
    const rowClass = isFinal ? `border-b-2 ${colors.bg} ${colors.border}` : isTotal ? T.rowTotal : T.row;
    return /* @__PURE__ */ jsxs("tr", { className: rowClass, children: [
      /* @__PURE__ */ jsxs("td", { className: `${T.cell} ${bold ? T.footerLabel + " text-ink-primary" : T.muted + " " + T.cellIndent} ${T.vline}`, children: [
        row.label,
        renderLabelSuffix?.(row, idx)
      ] }),
      extraColumn && /* @__PURE__ */ jsx("td", { className: T.vline, children: extraColumn.render(row, idx) }),
      row.values.map((v, i) => {
        const { display, title } = formatCell(v, fmt);
        const custom = renderCell?.(row, i, display);
        const originClass = getCellOriginClass?.(idx, i);
        const textClass = bold ? `${T.footerValue} ${originClass || "text-ink-primary"}` : originClass || "text-ink-secondary";
        return /* @__PURE__ */ jsx(
          "td",
          {
            title: custom ? void 0 : title,
            className: `${T.cellValue} ${custom ? "" : textClass}${!custom && title ? " cursor-default" : ""} ${i < row.values.length - 1 ? T.vline : ""}`,
            children: custom ?? display
          },
          i
        );
      })
    ] }, idx);
  }) }) }) });
};
var summary_default = SummaryTable;
var DeclaracionTable = ({
  columns,
  rows,
  data,
  totalLabel = "Suma Total",
  formatCurrency,
  colorScheme: colorSchemeProp,
  sourceFileIds,
  onViewSource,
  getCellOriginClass
}) => {
  const { bg: headerBg, text: headerText, border: borderColor } = resolveColors(colorSchemeProp);
  const showCodeColumn = rows.some((r) => r.code != null);
  return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
    tableshell_default,
    {
      headerBg,
      headerClassName: `border-b ${borderColor}`,
      rowCount: rows.length,
      renderHeader: () => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("th", { className: `text-left ${T.cell} font-medium ${headerText} ${T.vline}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          "Concepto",
          /* @__PURE__ */ jsx(SourceIcon, { fileIds: sourceFileIds, onViewSource, className: headerText })
        ] }) }),
        showCodeColumn && /* @__PURE__ */ jsx("th", { className: `text-left ${T.cell} font-medium ${headerText} ${T.vline}`, children: "C\xF3digo" }),
        columns.map((col, i) => /* @__PURE__ */ jsx("th", { className: `text-right ${T.cell} font-medium ${headerText} ${i < columns.length - 1 ? T.vline : ""}`, children: col.label }, col.key))
      ] }),
      renderFooter: totalLabel ? () => /* @__PURE__ */ jsxs("tr", { className: "font-semibold", children: [
        /* @__PURE__ */ jsx("td", { className: `${T.cell} text-ink-primary border-t border-edge-subtle/10`, children: totalLabel }),
        showCodeColumn && /* @__PURE__ */ jsx("td", { className: `${T.cell} border-t border-edge-subtle/10` }),
        columns.map((col) => {
          const summedRows = rows.filter((r) => r.summed);
          const hasAny = summedRows.some((r) => data[r.key]?.[col.key] != null);
          const sum = summedRows.reduce((acc, r) => acc + (data[r.key]?.[col.key] ?? 0), 0);
          return /* @__PURE__ */ jsx("td", { className: `${T.cellValue} ${hasAny ? ORIGIN_CLASSES.calculated : "text-ink-tertiary"} border-t border-edge-subtle/10`, children: hasAny ? formatCurrency(sum) : "\u2014" }, col.key);
        })
      ] }) : void 0,
      children: rows.map((row) => /* @__PURE__ */ jsxs("tr", { className: T.row, children: [
        /* @__PURE__ */ jsx("td", { className: `${T.cell} text-ink-secondary ${T.vline}`, children: row.label }),
        showCodeColumn && /* @__PURE__ */ jsx("td", { className: `${T.cell} text-ink-tertiary tabular-nums ${T.vline}`, children: row.code ?? "" }),
        columns.map((col, ci) => {
          const value = data[row.key]?.[col.key];
          return /* @__PURE__ */ jsx("td", { className: `${T.cellValue} ${value != null ? getCellOriginClass?.(row.key, col.key) || "text-ink-primary" : "text-ink-tertiary"} ${ci < columns.length - 1 ? T.vline : ""}`, children: value != null ? formatCurrency(value) : "\u2014" }, col.key);
        })
      ] }, row.key))
    }
  ) });
};
var declaracion_default = DeclaracionTable;
var CURRENCY_KEYS = [
  "total_activos",
  "total_pasivos",
  "patrimonio",
  "total_ingresos",
  "total_gastos",
  "resultado"
];
var COL_HEADERS = [
  { label: "" },
  { label: "Activos" },
  { label: "Pasivos" },
  { label: "Patrimonio" },
  { label: "Ingresos" },
  { label: "Gastos" },
  { label: "Resultado" }
];
var SHORT_MONTHS2 = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
function formatDate(d) {
  const [y, m] = d.split("-");
  return `${SHORT_MONTHS2[parseInt(m, 10) - 1]} ${y}`;
}
function parsePeriod(row) {
  if (row.from_date && row.to_date) {
    return { desde: formatDate(row.from_date), hasta: formatDate(row.to_date) };
  }
  if (row.periodo) return { desde: "", hasta: row.periodo };
  return null;
}
var BalanceTable = ({
  rows,
  onRowsChange,
  colorScheme: colorSchemeProp,
  onViewSource,
  getCellOriginClass
}) => {
  const { bg: headerBg, text: headerText, border: borderColor } = resolveColors(colorSchemeProp);
  const { getHoverProps } = useRowHover();
  const rowIds = rows.map((r) => r.id);
  const keyboard = useGridKeyboard({ visibleRowIds: rowIds });
  const handleChange = (rowIdx, key, value) => {
    const updated = [...rows];
    updated[rowIdx] = { ...updated[rowIdx], [key]: value };
    onRowsChange(updated);
  };
  if (rows.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "outline-none flex flex-col gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: `flex items-start justify-between gap-3 px-3 py-2 rounded-t ${headerBg} border-b ${borderColor}`, children: /* @__PURE__ */ jsx("div", { className: `text-xs font-semibold ${headerText} leading-snug`, children: "\u2014" }) }),
      /* @__PURE__ */ jsxs("table", { className: `${T.table} border-b border-edge-subtle/20`, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: COL_HEADERS.map((col, i) => /* @__PURE__ */ jsx(
          "th",
          {
            className: `${T.headerCell} ${T.th} ${i < COL_HEADERS.length - 1 ? T.vline : ""} ${i === 0 ? "text-left w-14" : "text-right"}`,
            children: col.label
          },
          i
        )) }) }),
        /* @__PURE__ */ jsx("tbody", { children: [0, 1].map((rowIdx) => /* @__PURE__ */ jsxs("tr", { className: rowIdx === 0 ? T.rowHover : T.rowBorder, children: [
          /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${T.vline} text-center`, children: /* @__PURE__ */ jsx("span", { className: "text-xs tabular-nums text-ink-tertiary", children: "\u2014" }) }),
          CURRENCY_KEYS.map((key, i) => /* @__PURE__ */ jsx(
            "td",
            {
              className: `${T.cellValue} ${i < CURRENCY_KEYS.length - 1 ? T.vline : ""} text-ink-tertiary`,
              children: "\u2014"
            },
            key
          ))
        ] }, rowIdx)) })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { onKeyDown: keyboard.handleContainerKeyDown, tabIndex: 0, className: "outline-none flex flex-col gap-3", children: rows.map((row, rowIdx) => {
    const participacion = row.participacion ?? 0;
    const period = parsePeriod(row);
    return /* @__PURE__ */ jsxs("div", { className: "group/row", ...getHoverProps(row.id), children: [
      /* @__PURE__ */ jsxs("div", { className: `flex items-start justify-between gap-3 px-3 py-2 rounded-t ${headerBg} border-b ${borderColor}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: `text-xs font-semibold ${headerText} leading-snug flex items-center gap-1.5`, children: [
            row.empresa || "\u2014",
            row.sourceFileId && onViewSource && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onViewSource([row.sourceFileId]);
                },
                className: "p-0.5 rounded hover:bg-surface-2/60 transition-all opacity-0 group-hover/row:opacity-100 cursor-pointer flex-shrink-0",
                title: "Ver documento fuente",
                children: /* @__PURE__ */ jsx(Eye, { size: 12, className: headerText })
              }
            )
          ] }),
          row.rut && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-ink-tertiary mt-0.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-ink-tertiary/70", children: "RUT" }),
            " ",
            row.rut
          ] })
        ] }),
        period && /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 text-[11px] text-ink-tertiary", children: period.desde ? `${period.desde} \u2013 ${period.hasta}` : period.hasta })
      ] }),
      /* @__PURE__ */ jsxs("table", { className: `${T.table} border-b border-edge-subtle/20`, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: COL_HEADERS.map((col, i) => /* @__PURE__ */ jsx(
          "th",
          {
            className: `${T.headerCell} ${T.th} ${i < COL_HEADERS.length - 1 ? T.vline : ""} ${i === 0 ? "text-left w-28" : "text-right"}`,
            children: col.label
          },
          i
        )) }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsxs("tr", { className: T.rowHover, children: [
            /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${T.vline} text-center`, children: /* @__PURE__ */ jsx("span", { className: "text-xs tabular-nums text-ink-primary", children: "Empresa 100%" }) }),
            CURRENCY_KEYS.map((key) => {
              const val = row[key];
              const isNeg = typeof val === "number" && val < 0;
              const isBold = key === "patrimonio" || key === "resultado";
              const isLast = key === "resultado";
              return /* @__PURE__ */ jsx(
                editablecell_default,
                {
                  value: val,
                  onChange: (v) => handleChange(rowIdx, key, v),
                  type: "currency",
                  hasData: val != null,
                  className: `${!isLast ? T.vline : ""} ${isNeg ? "text-status-pending" : ""} ${isBold ? "font-semibold" : ""}`,
                  originClass: getCellOriginClass?.(row.id, key),
                  keyboard,
                  rowId: row.id,
                  cellKey: key
                },
                key
              );
            })
          ] }),
          /* @__PURE__ */ jsxs("tr", { className: T.rowBorder, children: [
            /* @__PURE__ */ jsx("td", { className: `${T.cellEdit} ${T.vline} text-center`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-tertiary", children: "Participaci\xF3n" }),
              /* @__PURE__ */ jsx(
                EditableField,
                {
                  value: participacion,
                  onChange: (v) => handleChange(rowIdx, "participacion", v),
                  type: "percent",
                  symbol: "%",
                  originClass: getCellOriginClass?.(row.id, "participacion"),
                  keyboard,
                  rowId: row.id,
                  cellKey: "participacion"
                }
              )
            ] }) }),
            CURRENCY_KEYS.map((key) => {
              const val = row[key];
              const propVal = val != null && participacion > 0 ? Math.round(val * participacion / 100) : null;
              const isNeg = typeof propVal === "number" && propVal < 0;
              const isBold = key === "patrimonio" || key === "resultado";
              const isLast = key === "resultado";
              return /* @__PURE__ */ jsx(
                "td",
                {
                  className: `${T.cellValue} ${!isLast ? T.vline : ""} ${isNeg ? "text-status-pending" : ORIGIN_CLASSES.calculated} ${isBold ? "font-semibold" : ""}`,
                  children: propVal != null ? displayCurrencyCompact(propVal) : "\u2014"
                },
                key
              );
            })
          ] })
        ] })
      ] })
    ] }, row.id);
  }) });
};
var balance_default = BalanceTable;
var CollapsibleSection = ({
  label,
  collapsed,
  onToggle,
  summary,
  headerClassName,
  children
}) => {
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: onToggle,
        className: `w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-ink-secondary uppercase tracking-wide bg-surface-2 rounded hover:brightness-110 transition-colors cursor-pointer ${headerClassName || ""}`,
        children: [
          /* @__PURE__ */ jsx(Chevron, { size: 14, className: "shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: label }),
          summary && /* @__PURE__ */ jsx("span", { className: "ml-auto font-normal normal-case tracking-normal text-ink-tertiary", children: summary })
        ]
      }
    ),
    !collapsed && children
  ] });
};
var collapsiblesection_default = CollapsibleSection;
function useCollapsedState(keys, initialCollapsed = {}) {
  const [collapsed, setCollapsed] = useState(() => {
    const state = {};
    for (const k of keys) state[k] = initialCollapsed[k] ?? false;
    return state;
  });
  const toggle = useCallback((key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const expandAll = useCallback(() => {
    setCollapsed((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) next[k] = false;
      return next;
    });
  }, []);
  const collapseAll = useCallback(() => {
    setCollapsed((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) next[k] = true;
      return next;
    });
  }, []);
  return { collapsed, toggle, expandAll, collapseAll };
}

export { activossummary_default as ActivosSummary, assettable_default as AssetTable, balance_default as BalanceTable, boletas_default as BoletasTable, clickableheader_default as ClickableHeader, collapsiblesection_default as CollapsibleSection, assettable_default as CrudTable, DEFAULT_SCHEME, declaracion_default as DeclaracionTable, deletedialog_default as DeleteDialog, editablecell_default as EditableCell, EditableField, finalresults_default as FinalResultsCompact, MONTH_LABELS, ORIGIN_CLASSES, recyclebin_default as RecycleBin, SourceIcon, summary_default as SummaryTable, tableshell_default as TableShell, applyAutoCompute, applyAutoConversions, buildUfPair, renta_default as default, defaultFormatCurrency, displayCurrency, displayCurrencyCompact, formatDeletedDate, generateId, generateLastNMonths, resolveColors, useCollapsedState, useSoftDelete };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map