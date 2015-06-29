// Uses POSIX functions to send and receive data from a Maestro.
// NOTE: The Maestro's serial mode must be set to "USB Dual Port".
// NOTE: You must change the 'const char * device' line below.
// Pololu Maestro Servo Controller User's Guide 
// 5. Serial Interface Page 47 of 73

#include <fcntl.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <termios.h>

int debug = 0;
int num_macros = 0, *macro_values[64];
char *macro_names[64];

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
  if (debug)
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
  if (response[0] | response[1])
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

int *searchMacro(char *name) {
  int i, *rv = NULL;

  for (i = 0; i < num_macros; i++) {
    if (!strcmp(name, macro_names[i]))
      break;
  }

  if (i == num_macros) {
    if (debug)
      printf("Macro \'%s\' not found\n", name);
  } else {
    rv = macro_values[i];
    if (debug) {
      printf("search(%s): ", name);
      for (int j = 1; j <= macro_values[i][0]; j++)
        printf("%d ", macro_values[i][j]);
      printf("\n");
    }
  } 
  return rv;
}

void cli_usage(char **argv) {
    fprintf(stderr,     \
      "Usage: %s [-d device] [-i] [-h]\n"
      "    where device is a serial port\n"
      "    -i prints interactive prompt (default is to act as silent filter)\n"
      "    -h is this help info\n"
    , argv[0]);
}


void usage() {
  printf(     \
    "p pin-num [pin-num] value\n"
    "p macro-name value\n"
    "   Set position, where value is either an angle or a pulse width > 500 ms\n"
    "\n"
    "P pin-num [pin-num]\n"
    "P macro-name\n"
    "   Get position(s)\n"
    "\n"
    "s speed\n"
    "   Speed global set\n"
    "\n"
    "R [pulse-width]\n"
    "   Reset to 1500 or specified pulse width\n",
    "\n"
    "m macro-name pin-num [pin-num]\n"
    "   Create macro\n"
    "\n"
    "M macro-name\n"
    "M\n"
    "    List macros\n"
    "\n"
    "q\n"
    "   Quit\n"
    "\n"
    "h\n"
    "   Help (this info)\n"
    // "pin-num\n"
    // "    get status of pin-num\n"
  ); 
}

void prompt() {
  printf("> ");
}


int main(int argc, char **argv)
{
  // const char * device = "\\\\.\\USBSER000";  // Windows, "\\\\.\\COM6" also works
  // const char * device = "/dev/ttyACM0";      // Linux

  int interactive = 0;
  int n, angle = 0, targets[24], num_targets = 0, target = 0, position = 0, pin = 0, speed;
  char *device = "/dev/cu.usbmodem00113561", s[128], c;
  // const char * device = argc > 1 ? argv[1] : "/dev/cu.usbmodem00087311";    // Mac OS X

  while ((c = getopt (argc, argv, "d:Dhi")) != -1)
    switch (c) {
      case 'd':
        device = optarg;
        break;

      case 'D':
        debug = 1;
        break;

      case 'h':
        cli_usage(argv);
        exit(0);
        break;

      case 'i':
        interactive = 1;
        break;

      default:
        cli_usage(argv);
        exit(1);
        break;
    }


  
  int fd = open(device, O_RDWR | O_NOCTTY);
  if (fd == -1) {
    perror(device);
    return 1;
  }

  // is this needed?
  struct termios options;
  tcgetattr(fd, &options);
  options.c_lflag &= ~(ECHO | ECHONL | ICANON | ISIG | IEXTEN);
  options.c_oflag &= ~(ONLCR | OCRNL);
  tcsetattr(fd, TCSANOW, &options);

 
  while (1) {

    // if (interactive)  
    //  prompt();

    if (!fgets(s, sizeof(s), stdin))
      break;

    printf(">>> %s\n", s);
 
    if (*s == 'q')
      break;

    else if (*s == 'h') {
      usage();
      continue;
    }

    // set speed globally
    else if (*s == 's') {
      sscanf(s, "%c %d", &c, &speed);
      for (n = 0; n < 24; n++) {
        maestroSetSpeed(fd, n, speed);
        maestroGetErrors(fd);
      }
      continue;
    }

    else if (*s == 'm') {
      char *name = "";
      num_targets = 0;

      char *token = strtok(&s[1], " 	");
      while (token != NULL) {
        printf("token: %s\n", token);
        if (!strlen(name)) {
          name = strdup(token);
        } else {
          if (n = atoi(token))
            targets[num_targets++] = n;
          else
            printf("??\n");
        }
        token = strtok(NULL, " 	,");
      }

      if (debug) {
        for (int i = 0; i < num_targets; i++)
          printf("%d ", targets[i]);
        printf("\n");
      } 
      macro_names[num_macros] = name;

      // first item in macro is length of array, the rest are pin numbers
      int *a = (int *) malloc((num_targets + 1) * sizeof(int));
      a[0] = num_targets;
      memcpy(&a[1], targets, num_targets * sizeof(int));
      macro_values[num_macros] = a;

      if (debug) {
        printf("%d entries\n", a[0]);
        printf("%s = ", macro_names[num_macros]);
        for (int i = 0; i < num_targets; i++)
          printf("%d ", macro_values[num_macros][i]);
        printf("\n");
      }

      num_macros++;

      if (debug)
        printf("now there are %d macros\n", num_macros);

      continue;

    }

    else if (*s == 'M') {
      char name[128];
      int j, i = num_macros;

      if (sscanf(&s[1], "%s", name) > 0) {

        /***
        for (i = 0; i < num_macros; i++) {
          if (!strcmp(name, macro_names[i]))
            break;
        }

        if (i == num_macros) {
          printf("Macro \'%s\' not found\n", name);
        } else {
          for (int j = 1; j <= macro_values[i][0]; j++)
            printf("%d ", macro_values[i][j]);
          printf("\n");
        } 
        ****/
        int *x = searchMacro(name);
        if (x) {
          for (int j = 1; j <= x[0]; j++)
            printf("%d ", x[j]);
          printf("\n");
        }
      } else { 
        for (i = 0; i < num_macros; i++) {
          printf("%s = ", macro_names[i]);
          for (j = 1; j <= macro_values[i][0]; j++)
            printf("%d ", macro_values[i][j]);
          printf("\n");
         } 
      }
      continue;
    }

    // set all to specified width, or center
    else if (*s == 'R') {
      if (sscanf(s, "%c %d", &c, &target) < 2) {
        target = 1500;
      }
  printf(">>target: %d\n", target);
      for (n = 0; n < 24; n++) {
        maestroSetTarget(fd, n, target * 4);
        maestroGetErrors(fd);
      }
      continue;
    }

      
    else if (*s == 'p') {

      num_targets = 0;
      angle = SERVO_SWING_DEGREES / 2;

      char *ss = strdup(s);
      char *token = strtok(&ss[1], " 	,");

      while (token != NULL) {
        if (debug)
          printf("token: %s\n", token);

        targets[num_targets++] = atoi(token);

        if (debug) {
          printf("Raw : ");
          for (int i = 0; i < num_targets; i++)
            printf("%d ", targets[i]);
          printf("\n");
        }
        token = strtok(NULL, " 	,");
      }

      if (num_targets > 1)
        angle = targets[--num_targets];

      if (debug) {
        printf("Check: ");
        for (int i = 0; i < num_targets; i++)
          printf("%d ", targets[i]);
        printf("to %d\n", angle);
      }

      for (int i = 0; i < num_targets; i++) {
        pin = targets[i];

        position = maestroGetPosition(fd, pin);
        printf("current %d: %d degrees [%d \xC2\xB5sec].\n", pin, positionToAngle(position), position);

        // target = (position < 6000) ? 7000 : 5000;

        if (angle < 500) {
          target = angleToMicroseconds(angle) * 4;
          printf("setting %d to %d degrees [%d \xC2\xB5sec]\n", pin, angle, target/4);
        } else {
          target = angle * 4;
          printf("setting %d to %d \xC2\xB5sec\n", pin, angle);
        }
        maestroSetTarget(fd, pin, target);
      }
      free(ss);  
      continue;
    }
    
    else if (*s == 'P') {

      num_targets = 0;
      angle = SERVO_SWING_DEGREES / 2;

      char *token = strtok(&s[1], " 	,");
      while (token != NULL) {
        if (debug)
          printf("token: %s\n", token);
        if (n = atoi(token)) {
          targets[num_targets++] = n;
        }
        token = strtok(NULL, " 	,");
      }
      if (num_targets > 1)
        angle = targets[--num_targets];

      if (debug) {
        printf("Check: ");
        for (int i = 0; i < num_targets; i++)
          printf("%d ", targets[i]);
        printf("to %d\n", angle);
      }

      for (int i = 0; i < num_targets; i++) {
        pin = targets[i];
        position = maestroGetPosition(fd, pin);
        printf("%d : %d degrees [%d \xC2\xB5sec].\n", pin, positionToAngle(position), position);
      }
      continue;
    }
    
    // n = sscanf(s, "%d %d", &pin, &angle);
    // printf(">>%d\n", n);

    /****
    // just get status of pin
    else if (n < 2) {
      position = maestroGetPosition(fd, pin) / 4;
      printf("Pin %d: %s moving, position = %d \xC2\xB5sec\n", pin, "?", position);
      continue;
    }
    *****/

    else if (*s == 'h' || *s == '?')
      usage();

    else if (feof(stdin))
      break;

    else
      printf("i don\'t know what to do\n");
    
  }

  close(fd);
  return 0;
}
