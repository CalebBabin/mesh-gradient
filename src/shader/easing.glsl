#ifndef PI
#define PI 3.1415926535
#endif

float sineInOut(float t) {
  return -0.5 * (cos(PI * t) - 1.0);
}