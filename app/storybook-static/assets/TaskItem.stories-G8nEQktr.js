import{T as n}from"./TaskItem-CR0EVclX.js";import"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";const{fn:r}=__STORYBOOK_MODULE_TEST__,o={id:"task-1",title:"Buy groceries",completed:!1,dueDate:null,listId:"default"},d={title:"PixDone/App/TaskItem",component:n,tags:["autodocs"],argTypes:{isSmash:{control:"boolean"}},args:{onComplete:r(),onEdit:r(),onDelete:r()}},e={args:{task:o}},s={args:{task:{...o,completed:!0}}},a={args:{task:{...o,title:"Smash me!"},isSmash:!0}},t={args:{task:o,onDelete:r()}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    task: defaultTask
  }
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    task: {
      ...defaultTask,
      completed: true
    }
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    task: {
      ...defaultTask,
      title: 'Smash me!'
    },
    isSmash: true
  }
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    task: defaultTask,
    onDelete: fn()
  }
}`,...t.parameters?.docs?.source}}};const p=["Default","Completed","SmashMode","WithDelete"];export{s as Completed,e as Default,a as SmashMode,t as WithDelete,p as __namedExportsOrder,d as default};
