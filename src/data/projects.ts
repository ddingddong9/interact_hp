import { pythonChapters } from '../components/python/catalog';
import { cLessons } from '../components/c/lessons';
export const projects = [
  { href: '#hash-table', title: 'Data Structures', eyebrow: '', description: '', chapters: [
    { href: '#hash-table', title: 'Hash Table' },
    { href: '#linked-list', title: 'Linked List' },
    { href: '#skip-list', title: 'Skip List' },
    { href: '#sorted-set', title: 'Sorted Set' },
  ] },
  { href: '#race-condition', title: 'Concurrency', eyebrow: '', description: '', chapters: [
    { href: '#race-condition', title: 'Race Condition' },
    { href: '#lua-script', title: 'Lua Script' },
  ] },
  { href: '#admission-control', title: 'Booking System', eyebrow: '', description: '', chapters: [
    { href: '#admission-control', title: 'Admission Control' },
  ] },
  { href: '#java-constructor-chaining', title: 'Java', eyebrow: '', description: '', chapters: [
    { href: '#java-constructor-chaining', title: 'Constructor Chaining' },
    { href: '#java-super-this', title: 'super & this' },
    { href: '#java-field-hiding', title: 'Field Hiding' },
    { href: '#java-method-dispatch', title: 'Method Overriding' },
    { href: '#java-override-annotation', title: '@Override' },
    { href: '#java-method-overloading', title: 'Method Overloading' },
    { href: '#java-compile-time-binding', title: 'Compile-time Binding' },
    { href: '#java-abstract-class', title: 'Abstract Class' },
  ] },
  { href: '#c-pointer-basics', title: 'C', eyebrow: '', description: '', chapters: cLessons.map(lesson => ({ href: `#c-${lesson.id}`, title: lesson.title })) },
  { href: '#python-string-indexing', title: 'Python', eyebrow: '', description: '', chapters: pythonChapters.map(lesson => ({ href: `#python-${lesson.id}`, title: lesson.title })) },
];
