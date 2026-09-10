import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

function getInitialTheme(): Theme {
  // 저장된 모드가 있으면 불러오기
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch { /* 저장소를 사용할 수 없으면 기기 설정을 따릅니다. */ }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  // HTML에 다크 모드 스타일 적용
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem("theme", theme); } catch { /* 저장 없이도 전환합니다. */ }
}

function ThemeToggle({ visible = true }: { visible?: boolean }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const nextTheme = theme === "dark" ? "라이트 모드" : "다크 모드";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    // 현재 모드의 반대 모드 선택
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    const transitionDocument = document as ViewTransitionDocument;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!transitionDocument.startViewTransition || reduceMotion) {
      setTheme(newTheme);
      return;
    }

    // 아이콘 가운데에서 원형 애니메이션 시작
    const button = event.currentTarget.getBoundingClientRect();
    const x = button.left + button.width / 2;
    const y = button.top + button.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = transitionDocument.startViewTransition(() => {
      flushSync(() => setTheme(newTheme));
      applyTheme(newTheme);
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 560,
            easing: "ease-out",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => undefined);
  };

  // 프로젝트 주소로 바로 들어와도 모드를 적용하고, 아이콘은 홈에서만 표시합니다.
  if (!visible) return null;

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`${nextTheme}로 전환`}
      title={`${nextTheme}로 전환`}
    >
      {theme === "dark" ? (
        <SunIcon aria-hidden="true" />
      ) : (
        <MoonIcon aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;
