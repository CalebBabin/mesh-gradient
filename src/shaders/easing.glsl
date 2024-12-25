#ifndef PI
#define PI 3.14159265358979
#endif

float sineInOut(float t) {
    return -0.5 * (cos(PI * t) - 1.0);
}