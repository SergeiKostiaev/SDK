import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts', // Укажите файл, который будет входной точкой для библиотеки
      name: 'SdkVote',
      fileName: (format) => `sdk-vote.${format}.js`,
      formats: ['es', 'umd'], // Форматы сборки
    },
    rollupOptions: {
      external: ['react', 'react-dom'], // Укажите внешние зависимости
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
