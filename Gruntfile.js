"use strict";

module.exports = function (grunt) {
    grunt.initConfig({
        eslint: {
            src: [
                "Gruntfile.js",
                "index.js",
                "lib/**/*.js",
                "test/**/*.js"
            ]
        },

        vows: {
            all: {
                src: "test/*-test.js",
                options: {
                    reporter: "spec",
                    error: false
                }
            }
        },

        benchmark: {
            all: {
                src: [
                    "test/first.js",
                    "test/second.js",
                    "test/third.js",
                    "test/fourth.js",
                    "test/fifth.js"
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-vows-runner");
    grunt.loadNpmTasks("grunt-benchmark");

    grunt.registerTask("default", [
        "eslint",
        "vows",
        "benchmark"
    ]);
};
