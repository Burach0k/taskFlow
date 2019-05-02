const actions = (store) => ({
  addTask: ({ tasks }, task) => {
    return { tasks: [].concat(tasks, task) };
  },

  deleteTask: ({ tasks }, id) => {
    const index = tasks.findIndex((task) => task.id === id);
    tasks.splice(index, 1);
    return { tasks };
  },

  getTask: ({ tasks }, id) => {
    const index = tasks.findIndex((task) => task.id === id);
    return { edit: tasks[index] };
  },

  changeTask: ({ tasks }, data) => {
    const index = tasks.findIndex((task) => data.id === task.id);
    tasks[index] = { ...tasks[index], ...data };
    return { tasks: [].concat(tasks) };
  },
});

export default actions;
