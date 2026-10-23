import { InputManager, type InputKey } from "./InputManager";

type ControlBinding = Readonly<{
  key: InputKey;
  when: "pressed" | "held";
  handle: () => void;
}>;

export type ControlBindings<Action extends string> = Readonly<
  Partial<Record<Action, ControlBinding>>
>;

export class Controls<Action extends string> {
  constructor(
    private readonly input: InputManager,
    private bindings: ControlBindings<Action>,
  ) {
    this.input.clearPendingPresses();
  }

  setBindings(bindings: ControlBindings<Action>): void {
    this.bindings = bindings;
    this.input.clearPendingPresses();
  }

  update(): void {
    for (const action in this.bindings) {
      const binding = this.bindings[action];
      if (!binding) continue;

      const active =
        binding.when === "held"
          ? this.input.isDown(binding.key)
          : this.input.consumeKeyPress(binding.key);

      if (active) binding.handle();
    }
  }
}
