
export function trailZero(num) {
	if (isNaN(num)) return '1.0';
	if (num % 1 === 0) {
		return String(num) + '.0';
	}
	return String(num);
}