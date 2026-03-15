import{T as k}from"./TaskItem-x8syo12d.js";import"./iframe-DbiBQxMl.js";import"./preload-helper-PPVm8Dsz.js";const{fn:d,userEvent:y,within:s,expect:a}=__STORYBOOK_MODULE_TEST__,c={id:"task-1",title:"Buy groceries",completed:!1,dueDate:null,listId:"default"},v={title:"PixDone/App/TaskItem",component:k,tags:["autodocs"],argTypes:{isSmash:{control:"boolean"}},args:{onComplete:d(),onEdit:d(),onDelete:d()}},r={args:{task:c},play:async({canvasElement:e,args:t})=>{const n=s(e);a(n.getByText("Buy groceries")).toBeTruthy();const o=n.getByRole("checkbox");a(o).toBeTruthy(),await y.click(o),a(t.onComplete).toHaveBeenCalledWith("task-1")}},l={args:{task:{...c,completed:!0}},play:async({canvasElement:e})=>{const n=s(e).getByRole("checkbox");a(n.getAttribute("aria-checked")).toBe("true")}},i={args:{task:{...c,title:"Smash me!"},isSmash:!0},play:async({canvasElement:e})=>{const t=s(e),n=e.querySelector('[aria-label="Delete task"]');a(n).toBeNull(),a(t.getByText("Smash me!")).toBeTruthy()}},m={args:{task:c,onDelete:d()},play:async({canvasElement:e,args:t})=>{const o=s(e).getByLabelText("Delete task");await y.click(o),a(t.onDelete).toHaveBeenCalledWith("task-1")}},p={args:{task:{...c,dueDate:"2030-06-15"}},play:async({canvasElement:e})=>{const t=s(e);a(t.getByText(/6\/15/)).toBeTruthy()}},u={args:{task:{...c,repeat:"weekly"},lang:"en"},play:async({canvasElement:e})=>{const t=s(e);a(t.getByText(/Weekly/)).toBeTruthy()}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    task: defaultTask
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);
    // Title is visible
    expect(canvas.getByText('Buy groceries')).toBeTruthy();
    // Checkbox is rendered
    const checkbox = canvas.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
    // Click checkbox calls onComplete
    await userEvent.click(checkbox);
    expect(args.onComplete).toHaveBeenCalledWith('task-1');
  }
}`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    task: {
      ...defaultTask,
      completed: true
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  }
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    task: {
      ...defaultTask,
      title: 'Smash me!'
    },
    isSmash: true
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // No delete button in smash mode
    const deleteBtn = canvasElement.querySelector('[aria-label="Delete task"]');
    expect(deleteBtn).toBeNull();
    expect(canvas.getByText('Smash me!')).toBeTruthy();
  }
}`,...i.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    task: defaultTask,
    onDelete: fn()
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);
    const deleteBtn = canvas.getByLabelText('Delete task');
    await userEvent.click(deleteBtn);
    expect(args.onDelete).toHaveBeenCalledWith('task-1');
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    task: {
      ...defaultTask,
      dueDate: '2030-06-15'
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    // Date badge is present (6/15 format)
    expect(canvas.getByText(/6\\/15/)).toBeTruthy();
  }
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    task: {
      ...defaultTask,
      repeat: 'weekly'
    },
    lang: 'en'
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Weekly/)).toBeTruthy();
  }
}`,...u.parameters?.docs?.source}}};const x=["Default","Completed","SmashMode","WithDelete","WithDueDate","WithRepeat"];export{l as Completed,r as Default,i as SmashMode,m as WithDelete,p as WithDueDate,u as WithRepeat,x as __namedExportsOrder,v as default};
