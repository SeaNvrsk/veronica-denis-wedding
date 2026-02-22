export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Где познакомились Вероника и Денис?",
    options: ["На работе", "В университете", "Через друзей", "В кафе"],
    correctIndex: 2,
  },
  {
    id: 2,
    question: "В каком году они начали встречаться?",
    options: ["2020", "2021", "2022", "2023"],
    correctIndex: 2,
  },
  {
    id: 3,
    question: "Любимое время года Вероники?",
    options: ["Весна", "Лето", "Осень", "Зима"],
    correctIndex: 0,
  },
  {
    id: 4,
    question: "Чем увлекается Денис в свободное время?",
    options: ["Футбол", "Рыбалка", "Путешествия", "Все перечисленное"],
    correctIndex: 3,
  },
  {
    id: 5,
    question: "Какой город они хотят посетить в медовый месяц?",
    options: ["Париж", "Италия", "Япония", "Мальдивы"],
    correctIndex: 1,
  },
];
