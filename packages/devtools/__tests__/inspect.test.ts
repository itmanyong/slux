import { describe, it, expect, rs, beforeEach } from "rstack/test";
import { inspect, clearInspectors, InspectEventType } from "../src/index.js";
import type { InspectEvent } from "../src/index.js";
import { emitInspectEvent } from "../src/inspect.js";

function makeEvent(overrides?: Partial<InspectEvent>): InspectEvent {
  return {
    type: InspectEventType.SET,
    storeName: "TestStore",
    action: "set:count",
    state: { count: 1 },
    prevState: { count: 0 },
    timestamp: 1000,
    ...overrides,
  };
}

describe("inspect", () => {
  beforeEach(() => {
    clearInspectors();
  });

  it("registers a callback and receives events", () => {
    const cb = rs.fn();
    inspect(cb);

    const event = makeEvent();
    emitInspectEvent(event);

    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(event);
  });

  it("returns an unsubscribe function that removes the callback", () => {
    const cb = rs.fn();
    const unsub = inspect(cb);

    emitInspectEvent(makeEvent());
    expect(cb).toHaveBeenCalledOnce();

    unsub();

    emitInspectEvent(makeEvent());
    expect(cb).toHaveBeenCalledOnce(); // not called again
  });

  it("calling unsubscribe twice is a safe no-op", () => {
    const cb = rs.fn();
    const unsub = inspect(cb);

    unsub();
    unsub(); // second call should not throw

    emitInspectEvent(makeEvent());
    expect(cb).not.toHaveBeenCalled();
  });

  it("supports multiple inspectors receiving the same event", () => {
    const cb1 = rs.fn();
    const cb2 = rs.fn();
    const cb3 = rs.fn();

    inspect(cb1);
    inspect(cb2);
    inspect(cb3);

    const event = makeEvent();
    emitInspectEvent(event);

    expect(cb1).toHaveBeenCalledWith(event);
    expect(cb2).toHaveBeenCalledWith(event);
    expect(cb3).toHaveBeenCalledWith(event);
  });

  it("does not call removed inspector while others remain", () => {
    const cb1 = rs.fn();
    const cb2 = rs.fn();

    const unsub1 = inspect(cb1);
    inspect(cb2);

    unsub1();

    emitInspectEvent(makeEvent());

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("emitInspectEvent is a no-op when no inspectors registered", () => {
    emitInspectEvent(makeEvent());
  });

  it("passes correct event payload for init events", () => {
    const cb = rs.fn();
    inspect(cb);

    const event: InspectEvent = {
      type: InspectEventType.INIT,
      storeName: "TestStore",
      state: { count: 1 },
      timestamp: 1000,
    };
    emitInspectEvent(event);

    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ type: "init" }));
  });

  it("passes correct event payload for destroy events", () => {
    const cb = rs.fn();
    inspect(cb);

    const event: InspectEvent = {
      type: InspectEventType.DESTROY,
      storeName: "TestStore",
      state: { count: 1 },
      timestamp: 1000,
    };
    emitInspectEvent(event);

    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ type: "destroy" }));
  });

  it("clearInspectors removes all registered callbacks", () => {
    const cb1 = rs.fn();
    const cb2 = rs.fn();

    inspect(cb1);
    inspect(cb2);

    clearInspectors();

    emitInspectEvent(makeEvent());

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it("a throwing callback does not prevent other callbacks from firing", () => {
    const cb1 = rs.fn(() => {
      throw new Error("inspector error");
    });
    const cb2 = rs.fn();

    inspect(cb1);
    inspect(cb2);

    const event = makeEvent();
    emitInspectEvent(event);

    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledWith(event);
  });
});

describe("InspectEventType", () => {
  it("has the expected values", () => {
    expect(InspectEventType.SET).toBe("set");
    expect(InspectEventType.INIT).toBe("init");
    expect(InspectEventType.DESTROY).toBe("destroy");
  });
});
