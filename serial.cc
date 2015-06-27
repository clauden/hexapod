// Uses POSIX functions to send and receive data from a Maestro.
// NOTE: The Maestro's serial mode must be set to "USB Dual Port".
// NOTE: You must change the 'const char * device' line below.
// Pololu Maestro Servo Controller User's Guide 
// 5. Serial Interface Page 47 of 73

#include <fcntl.h>
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <termios.h>

//
// Gets the position of a Maestro channel in quarter-microsecond units.
//
int maestroGetPosition(int fd, unsigned char channel)
{
  unsigned char command[] = {0x90, channel};
  if(write(fd, command, sizeof(command)) == -1) {
    perror("error writing");
    return -1;
  }

  unsigned char response[2];
  if(read(fd,response,2) != 2) {
    perror("error reading");
    return -1;
  }
  printf("\t> raw position: %d %d\n", response[0], response[1]);

  return response[0] + 256*response[1];
}

int maestroGetErrors(int fd) 
{
  unsigned char command[] = {0xA1};
  if(write(fd, command, sizeof(command)) == -1) {
    perror("error writing");
    return -1;
  }

  unsigned char response[2];
  if(read(fd,response,2) != 2) {
    perror("error reading");
    return -1;
  }
  printf("\t> raw error : %d %d\n", response[0], response[1]);

  return response[0] + 256*response[1];
}


// Sets the target of a Maestro channel.
// See the "Serial Servo Commands" section of the user's guide.
// The units of 'target' are quarter-microseconds.
int maestroSetTarget(int fd, unsigned char channel, unsigned short target)
{
  unsigned char command[] = {0x84, channel, target & 0x7F, target >> 7 & 0x7F};
  if (write(fd, command, sizeof(command)) == -1) {
    perror("error writing");
    return -1;
  }
  return 0;
}

// Sets the speed of a Maestro channel in units of (250 ns/10 ms).
// I would be lying if I said I fully grasped how this works.
//
int maestroSetSpeed(int fd, unsigned char channel, unsigned short speed)
{
  unsigned char command[] = {0x87, channel, speed & 0x7F, speed >> 7 & 0x7F};
  if (write(fd, command, sizeof(command)) == -1) {
    perror("error writing");
    return -1;
  }
  return 0;
}

// servo arc angle
#define SERVO_SWING_DEGREES 120

//
// assume:
//  0 degress = 1000 usec
// 90 degrees = 1500 usec
// 180 degrees = 2000 usec
//
int angleToMicroseconds(int angle) {
  if (angle < 0)
    angle = 0;
  if (angle > 180)
    angle = 180;

  int rv = 1000 + int((1000.0 * angle) / SERVO_SWING_DEGREES);
  return rv;
}


//
int positionToAngle(int maestroUnits)
{
  int ms = maestroUnits / 4;
  int angle = int((ms * SERVO_SWING_DEGREES) / 1000.0);
  return angle;
}


int main(int argc, char **argv)
{
  // const char * device = "\\\\.\\USBSER000"; // Windows, "\\\\.\\COM6" also works
  //const char * device = "/dev/ttyACM0"; // Linux

  const char * device = argc > 1 ? argv[1] : "/dev/cu.usbmodem00087311";    // Mac OS X

  int fd = open(device, O_RDWR | O_NOCTTY);
  if (fd == -1) {
    perror(device);
    return 1;
  }

  struct termios options;
  tcgetattr(fd, &options);
  options.c_lflag &= ~(ECHO | ECHONL | ICANON | ISIG | IEXTEN);
  options.c_oflag &= ~(ONLCR | OCRNL);
  tcsetattr(fd, TCSANOW, &options);

  // Initialize file descriptor sets
  fd_set read_fds, write_fds, except_fds;
  FD_ZERO(&read_fds);
  FD_ZERO(&write_fds);
  FD_ZERO(&except_fds);
  FD_SET(fd, &read_fds);

  // Set timeout to 1.0 seconds
  struct timeval timeout;
  timeout.tv_sec = 1;
  timeout.tv_usec = 0;

  int n, angle = 0, target = 0, position = 0, pin = 0, speed;
  char s[128], c;
 
  while (1) {

    printf("[pin-num [target-angle]] ['s' speed-value] ['q'] > ");
    fgets(s, sizeof(s), stdin);
  
    if (*s == 'q')
      break;

    if (*s == 's') {
      sscanf(s, "%c %d", &c, &speed);
      for (n = 0; n < 24; n++) {
        maestroSetSpeed(fd, n, speed);
        maestroGetErrors(fd);
      }
      continue;
    }

    n = sscanf(s, "%d %d", &pin, &angle);
    printf(">>%d\n", n);

    // just get status of pin
    if (n < 2) {
      position = maestroGetPosition(fd, pin) / 4;
      printf("Pin %d: %s moving, position = %d \xC2\xB5sec\n", pin, "?", position);
      continue;
    }
    
    printf("About to set %d to angle %d\n", pin, target);

    position = maestroGetPosition(fd, pin);
    printf("Current position of %d is %d degrees [%d \xC2\xB5sec].\n", pin, positionToAngle(position), position);


    // target = (position < 6000) ? 7000 : 5000;
    target = angleToMicroseconds(angle) * 4;

    printf("Setting target to %d degrees [%d \xC2\xB5sec].\n", angle, target/4);
    maestroSetTarget(fd, pin, target);
  }

  close(fd);
  return 0;
}
