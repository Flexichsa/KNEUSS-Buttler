import { useState } from "react";
import { cn } from "@/lib/utils";
import { Delete } from "lucide-react";

export function CalculatorWidget() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  };

  const inputPercent = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "×":
        return prev * current;
      case "÷":
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const equals = () => {
    if (operator && previousValue !== null) {
      const inputValue = parseFloat(display);
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const Button = ({ 
    children, 
    onClick, 
    className,
    variant = "number"
  }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    className?: string;
    variant?: "number" | "operator" | "function" | "equals";
  }) => {
    const variants = {
      number: "bg-slate-700 hover:bg-slate-600 text-white",
      operator: "bg-amber-500 hover:bg-amber-400 text-white",
      function: "bg-slate-500 hover:bg-slate-400 text-white",
      equals: "bg-amber-500 hover:bg-amber-400 text-white",
    };

    return (
      <button
        onClick={onClick}
        className={cn(
          "rounded-full text-xl font-medium transition-colors flex items-center justify-center",
          "h-12 w-12 sm:h-14 sm:w-14",
          variants[variant],
          className
        )}
        data-testid={`calc-button-${children}`}
      >
        {children}
      </button>
    );
  };

  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (value.includes('.') && value.endsWith('.')) return value;
    if (value.length > 12) {
      return num.toExponential(6);
    }
    return value;
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden flex flex-col p-3" data-testid="calculator-widget">
      <div className="flex-1 flex items-end justify-end px-2 pb-2 min-h-[60px]">
        <div className="text-right">
          {operator && previousValue !== null && (
            <div className="text-white/40 text-sm">{previousValue} {operator}</div>
          )}
          <div className="text-white text-3xl sm:text-4xl font-light tracking-tight truncate">
            {formatDisplay(display)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 justify-items-center">
        <Button variant="function" onClick={clear}>C</Button>
        <Button variant="function" onClick={toggleSign}>±</Button>
        <Button variant="function" onClick={inputPercent}>%</Button>
        <Button variant="operator" onClick={() => performOperation("÷")}>÷</Button>

        <Button onClick={() => inputDigit("7")}>7</Button>
        <Button onClick={() => inputDigit("8")}>8</Button>
        <Button onClick={() => inputDigit("9")}>9</Button>
        <Button variant="operator" onClick={() => performOperation("×")}>×</Button>

        <Button onClick={() => inputDigit("4")}>4</Button>
        <Button onClick={() => inputDigit("5")}>5</Button>
        <Button onClick={() => inputDigit("6")}>6</Button>
        <Button variant="operator" onClick={() => performOperation("-")}>−</Button>

        <Button onClick={() => inputDigit("1")}>1</Button>
        <Button onClick={() => inputDigit("2")}>2</Button>
        <Button onClick={() => inputDigit("3")}>3</Button>
        <Button variant="operator" onClick={() => performOperation("+")}>+</Button>

        <Button onClick={() => inputDigit("0")} className="col-span-1">0</Button>
        <Button onClick={backspace}><Delete className="h-5 w-5" /></Button>
        <Button onClick={inputDecimal}>,</Button>
        <Button variant="equals" onClick={equals}>=</Button>
      </div>
    </div>
  );
}
