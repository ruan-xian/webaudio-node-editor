import { Zoom, AreaPlugin } from 'rete-area-plugin';
import anime from "animejs/lib/anime.es.js";

export class SmoothZoom extends Zoom {
	animation?: any;

	screenToArea(x: number, y: number, t: any) {
		const { x: tx, y: ty, k } = t;

		return { x: (x - tx) / k, y: (y - ty) / k };
	}

	areaToScreen(x: number, y: number, t: any) {
		const { x: tx, y: ty, k } = t;

		return { x: x * k + tx, y: y * k + ty };
	}

	constructor(
		intensity: number,
		private duration: number,
		private easing: string,
		private area: AreaPlugin<any, any>
	) {
		super(intensity);
	}

	wheel = (e: WheelEvent) => {
		e.preventDefault();

		const isNegative = e.deltaY < 0;
		const delta = isNegative ? this.intensity : -this.intensity * 0.75;
		const { left, top } = this.container.getBoundingClientRect();
		const ox = e.clientX - left;
		const oy = e.clientY - top;

		const coords = this.screenToArea(ox, oy, this.area.area.transform);

		const { k } = this.area.area.transform;
		const targets = {
			zoom: k
		};
		const { duration, easing } = this;

		if (this.animation) {
			this.animation.reset();
		}
		this.animation = anime({
			targets,
			x: coords.x,
			y: coords.y,
			zoom: k * (1 + delta),
			duration,
			easing,
			update: () => {
				const currentTransform = this.area.area.transform;

				const coordinates = this.areaToScreen(coords.x, coords.y, currentTransform);

				const nextX = coordinates.x - coords.x * targets.zoom;
				const nextY = coordinates.y - coords.y * targets.zoom;

				this.area.area.zoom(
					targets.zoom,
					nextX - currentTransform.x,
					nextY - currentTransform.y
				);
			}
		});
	};

	dblclick = (e: MouseEvent) => {
		return;
	}

	destroy() {
		super.destroy();
		if (this.animation) {
			this.animation.reset();
		}
	}
}