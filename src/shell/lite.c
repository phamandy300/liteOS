#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <emscripten.h>
#include <dirent.h>
#include <sys/stat.h>

void loop();
char **splitLine(char *);
int execute(char **);

EM_ASYNC_JS(char*, js_readline, (), {
    return new Promise(resolve => {
        window.__requestLine = resolve;
    }).then(line => {
        var len = lengthBytesUTF8(line) + 1;
        var buf = _malloc(len);
        stringToUTF8(line, buf, len);
        return buf;
    });
});

EM_JS(void, js_print_prompt, (const char* cwd), {
    var str = UTF8ToString(cwd);
    if (window.__printPrompt) window.__printPrompt(str);
});

EM_ASYNC_JS(char*, js_edit_file, (const char* filename, const char* content), {
    return new Promise(resolve => {
        var fname = UTF8ToString(filename);
        var text  = UTF8ToString(content);
        window.__openEditor(fname, text, resolve);
    }).then(newContent => {
        var len = lengthBytesUTF8(newContent) + 1;
        var buf = _malloc(len);
        stringToUTF8(newContent, buf, len);
        return buf;
    });
});

int main(int argc, char **argv) {
    loop();
    return 0;
}

void loop() {
    char *line;
    char **args;
    int status;
    char cwd[1024];

    do {
        getcwd(cwd, sizeof(cwd));
        js_print_prompt(cwd);
        line = js_readline();
        args = splitLine(line);
        status = execute(args);
        free(line);
        free(args);
    } while(status);
}

#define LINE_BUFFER_SIZE 1024
#define TOKEN_BUFFER_SIZE 64

char **splitLine(char *line) {
    int bufSize = TOKEN_BUFFER_SIZE;
    char** tokens = malloc(sizeof(char*) * bufSize);
    char *token;
    int position = 0;

    if (!tokens) {
        fprintf(stderr, "lite: allocation error\n");
        exit(EXIT_FAILURE);
    }

    const char *delims = " \t\r\n\a";
    token = strtok(line, delims);

    while (token != NULL) {
        tokens[position++] = token;

        if (position >= bufSize) {
            bufSize += TOKEN_BUFFER_SIZE;
            tokens = realloc(tokens, sizeof(char*) * bufSize);
            if (!tokens) {
                fprintf(stderr, "lite: allocation error\n");
                exit(EXIT_FAILURE);
            }
        }

        token = strtok(NULL, delims);
    }

    tokens[position] = NULL;
    return tokens;
}

int ltCd(char **);
int ltHelp(char **);
int ltExit(char **);
int ltEcho(char **);
int ltLs(char **);
int ltMkdir(char **);
int ltCat(char **);
int ltEdit(char **);

char *builtinStr[] = {
    "cd",
    "help",
    "exit",
    "echo",
    "ls",
    "mkdir",
    "cat",
    "edit",
};

int (*builtinFunc[])(char **) = {
    &ltCd,
    &ltHelp,
    &ltExit,
    &ltEcho,
    &ltLs,
    &ltMkdir,
    &ltCat,
    &ltEdit,
};

int numBuiltIns() {
    return sizeof(builtinStr) / sizeof(char *);
}

int ltCd(char **args) {
    if (args[1] == NULL) {
        fprintf(stderr, "lite: expected argument to \"cd\"\n");
    } else {
        if (chdir(args[1]) != 0) {
            perror("lite");
        }
    }
    return 1;
}

int ltHelp(char **args) {
    printf("Lite Shell\n");
    printf("Built-in commands:\n");
    for (int i = 0; i < numBuiltIns(); i++) {
        printf("  %s\n", builtinStr[i]);
    }
    return 1;
}

int ltExit(char **args) {
    return 0;
}

int ltEcho(char **args) {
    for (int i = 1; args[i] != NULL; i++) {
        printf("%s ", args[i]);
    }
    printf("\n");
    return 1;
}

int ltLs(char **args) {
    char* path = args[1] != 0 ? args[1]: ".";
    DIR *dr = opendir(path);
    if (!dr) {
        perror("lite");
        return 1;
    }

    struct dirent *de;
    while ((de = readdir(dr)) != NULL) {
        if (de->d_name[0] == '.') continue;
        printf("%s\n", de->d_name);
    }

    closedir(dr);

    return 1;
}

int ltMkdir(char **args) {
    char* dirName = args[1];
    if (mkdir(dirName, 0755) != 0) {
        perror("lite");
        return 1;
    }
    return 1;
}

int ltCat(char **args) {
    char* fileName = args[1];
    // char* lines = args[2];

    return 1;
}

int ltEdit(char **args) {
    if (args[1] == NULL) {
        fprintf(stderr, "lite: edit: expected a filename\n");
        return 1;
    }

    const char *fileName = args[1];
    
    return 1;
}

int execute(char **args) {
    if (args[0] == NULL) {
        return 1;
    }

    for (int i = 0; i < numBuiltIns(); i++) {
        if (strcmp(args[0], builtinStr[i]) == 0) {
            return (*builtinFunc[i])(args);
        }
    }

    printf("lite: %s: command not found\n", args[0]);
    return 1;
}