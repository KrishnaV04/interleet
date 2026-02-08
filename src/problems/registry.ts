import type { ComponentType } from "react";

export interface Problem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  hasVisualization: boolean;
}

export interface ProblemVisualization {
  component: ComponentType;
  markdown: string;
}

export const problems: Problem[] = [
  { id: 1, title: "Two Sum", difficulty: "Easy", hasVisualization: true },
  { id: 2, title: "Add Two Numbers", difficulty: "Medium", hasVisualization: false },
  { id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", hasVisualization: false },
  { id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", hasVisualization: false },
  { id: 5, title: "Longest Palindromic Substring", difficulty: "Medium", hasVisualization: false },
  { id: 6, title: "Zigzag Conversion", difficulty: "Medium", hasVisualization: false },
  { id: 7, title: "Reverse Integer", difficulty: "Medium", hasVisualization: false },
  { id: 8, title: "String to Integer (atoi)", difficulty: "Medium", hasVisualization: false },
  { id: 9, title: "Palindrome Number", difficulty: "Easy", hasVisualization: false },
  { id: 10, title: "Regular Expression Matching", difficulty: "Hard", hasVisualization: false },
  { id: 11, title: "Container With Most Water", difficulty: "Medium", hasVisualization: false },
  { id: 12, title: "Integer to Roman", difficulty: "Medium", hasVisualization: false },
  { id: 13, title: "Roman to Integer", difficulty: "Easy", hasVisualization: false },
  { id: 14, title: "Longest Common Prefix", difficulty: "Easy", hasVisualization: false },
  { id: 15, title: "3Sum", difficulty: "Medium", hasVisualization: false },
  { id: 16, title: "3Sum Closest", difficulty: "Medium", hasVisualization: false },
  { id: 17, title: "Letter Combinations of a Phone Number", difficulty: "Medium", hasVisualization: false },
  { id: 18, title: "4Sum", difficulty: "Medium", hasVisualization: false },
  { id: 19, title: "Remove Nth Node From End of List", difficulty: "Medium", hasVisualization: false },
  { id: 20, title: "Valid Parentheses", difficulty: "Easy", hasVisualization: false },
];
