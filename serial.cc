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

// Gets the position of a Maestro channel.
// See the "Serial Servo Commands" section of the user's guide.
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

int main(int argc, char **argv)
{
  // Open the Maestro's virtual COM port.
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

  int target = 0, position = 0, pin = 0;
  char s[128];
  
  while (1) {

    printf("pin target (or q) > ");
    fgets(s, sizeof(s), stdin);
    if (*s == 'q')
      break;

    sscanf(s, "%d %d", &pin, &target);
    printf("About to set %d to %d\n", pin, target);

    position = maestroGetPosition(fd, pin);
    printf("Current position of %d is %d.\n", pin, position);

    // target = (position < 6000) ? 7000 : 5000;
    printf("Setting target to %d (%d us).\n", target, target/4);
    maestroSetTarget(fd, pin, target);
  }

  close(fd);
  return 0;
}
