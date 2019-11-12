export const TSCONFIG = `{
    "compilerOptions": {
      "baseUrl": "./",
      "allowSyntheticDefaultImports": true,
      "module": "es2015",
      "target": "es5",
      "lib": ["es6", "dom"],
      "sourceMap": true,
      "allowJs": false,
      "jsx": "react",
      "moduleResolution": "node",
      "rootDir": "../",
      "outDir": "dist",
      "noImplicitReturns": true,
      "noImplicitThis": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "declaration": true
    },
    "include": ["src/lib/**/*", "src/stories/**/*"],
    "exclude": [
      "node_modules",
      "build",
      "dist",
      "scripts",
      "acceptance-tests",
      "webpack",
      "jest",
      "src/setupTests.ts",
      "**/*/*.test.ts",
      "examples"
    ]
  }
`;