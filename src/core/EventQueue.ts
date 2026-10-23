const MAX_EVENTS_PER_FLUSH = 1000;

export type EventWriter<TEvent> = {
  emit: (event: TEvent) => void;
};

export class EventQueue<TEvent> implements EventWriter<TEvent> {
  private pending: TEvent[] = [];
  private readonly listeners = new Set<(event: TEvent) => void>();
  private flushing = false;

  emit(event: TEvent): void {
    this.pending.push(event);
  }

  subscribe(listener: (event: TEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  flush(): void {
    if (this.flushing) return;

    this.flushing = true;
    try {
      let dispatched = 0;
      while (this.pending.length > 0) {
        const batch = this.pending;
        this.pending = [];

        for (const event of batch) {
          if (++dispatched > MAX_EVENTS_PER_FLUSH) {
            throw new Error("Too many events in one update");
          }
          for (const listener of [...this.listeners]) {
            listener(event);
          }
        }
      }
    } finally {
      this.flushing = false;
    }
  }
}
