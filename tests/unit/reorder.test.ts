import { describe, it } from "node:test";
import assert from "node:assert/strict";

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return items;
  }
  const result = [...items];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

function assignSortOrders<T extends { id: string }>(items: T[]): Array<T & { sort_order: number }> {
  return items.map((item, index) => ({
    ...item,
    sort_order: (index + 1) * 10,
  }));
}

describe("Reorder Logic & Batch Interval Assignment", () => {
  const initial = [
    { id: "proc-1", title: "ABG Sampling" },
    { id: "proc-2", title: "CVP Measurement" },
    { id: "proc-3", title: "12-Lead ECG" },
  ];

  it("moves an item up one position", () => {
    const reordered = moveItem(initial, 1, 0);
    assert.deepEqual(reordered.map((p) => p.id), ["proc-2", "proc-1", "proc-3"]);
  });

  it("moves an item down one position", () => {
    const reordered = moveItem(initial, 1, 2);
    assert.deepEqual(reordered.map((p) => p.id), ["proc-1", "proc-3", "proc-2"]);
  });

  it("handles out of bounds indices gracefully", () => {
    const cannotMoveTopUp = moveItem(initial, 0, -1);
    assert.deepEqual(cannotMoveTopUp, initial);

    const cannotMoveBottomDown = moveItem(initial, 2, 3);
    assert.deepEqual(cannotMoveBottomDown, initial);
  });

  it("assigns ascending 10-interval sort orders", () => {
    const reordered = moveItem(initial, 2, 0);
    const withSort = assignSortOrders(reordered);

    assert.equal(withSort[0].id, "proc-3");
    assert.equal(withSort[0].sort_order, 10);

    assert.equal(withSort[1].id, "proc-1");
    assert.equal(withSort[1].sort_order, 20);

    assert.equal(withSort[2].id, "proc-2");
    assert.equal(withSort[2].sort_order, 30);
  });
});
