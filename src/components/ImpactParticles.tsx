import type { CSSProperties } from "react";

export type Impact = {
  id: number;
  x: number;
  y: number;
  final: boolean;
};

function ImpactParticles({ impacts }: { impacts: Impact[] }) {
  return (
    <div className="impact-layer" aria-hidden="true">
      {impacts.map((impact) => (
        <div
          key={impact.id}
          className={`impact-burst ${impact.final ? "impact-final" : ""}`}
          style={{ left: `${impact.x}%`, top: `${impact.y}%` }}
        >
          <span className="impact-ring" />
          {Array.from({ length: impact.final ? 24 : 8 }, (_, index) => {
            // 각 조각이 서로 다른 방향으로 퍼짐
            const angle = (index / (impact.final ? 24 : 8)) * Math.PI * 2;
            const distance = (impact.final ? 120 : 40) + (index % 3) * 18;
            return (
              <i
                key={index}
                style={{
                  "--spark-x": `${Math.cos(angle) * distance}px`,
                  "--spark-y": `${Math.sin(angle) * distance}px`,
                  "--spark-turn": `${index * 47}deg`,
                } as CSSProperties}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default ImpactParticles;
