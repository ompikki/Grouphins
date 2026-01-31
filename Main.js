document.addEventListener('DOMContentLoaded', () => {
  const createCard = document.querySelector('.project-card.create-project');
  const createModal = document.getElementById('createProjectModal');
  const addTaskModal = document.getElementById('addTaskModal');
  const closeButtons = document.querySelectorAll('.modal .close');
  const projectGrid = document.querySelector('.project-grid');
  const dashboard = document.querySelector('.dashboard');
  const projectDetails = document.querySelector('.project-details');
  const backBtn = document.querySelector('.back-btn');
  const addTaskBtn = document.querySelector('.add-task-btn');
  let currentProjectId = null;

  let projects = JSON.parse(localStorage.getItem('projects')) || [];
  const saveProjects = () => localStorage.setItem('projects', JSON.stringify(projects));

  function updateProgress(card, project) {
    const tooltip = card.querySelector('.progress-tooltip');
    if (!tooltip) return;
    const bar = tooltip.querySelector('.progress-bar');
    const text = tooltip.querySelector('.progress-text');
    const total = project.tasks.length;
    const done = project.tasks.filter(t => t.status === 'Done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '% Complete';

    // Add glow effect when complete
    if (percent === 100) {
      card.style.boxShadow = '0 0 20px #06D6A0';
      setTimeout(() => { card.style.boxShadow = ''; }, 2000);
    }
  }

  function createProjectCard(project) {
    const card = document.createElement('div');
    card.classList.add('project-card');
    card.dataset.id = project.id;

    card.innerHTML = `
      <h3>${project.title}</h3>
      <p class="project-due">Due: ${project.due}</p>
      <p class="project-desc">${project.desc}</p>
      <div class="progress-tooltip">
        <div class="progress-bar"></div>
        <span class="progress-text">0% Complete</span>
      </div>
      <div class="card-buttons">
        <button class="open-btn">Open</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    projectGrid.insertBefore(card, createCard);
    attachOpenBtn(card);
    attachDeleteBtn(card);
    updateProgress(card, project);
  }

  function attachOpenBtn(card) {
    const openBtn = card.querySelector('.open-btn');
    openBtn.addEventListener('click', () => {
      currentProjectId = card.dataset.id;
      const project = projects.find(p => p.id === currentProjectId);
      if (!project) return;

      projectDetails.querySelector('.project-title').textContent = project.title;
      projectDetails.querySelector('.project-desc').textContent = project.desc;
      projectDetails.querySelector('.project-due').textContent = `Due: ${project.due}`;

      const tbody = projectDetails.querySelector('tbody');
      tbody.innerHTML = '';
      project.tasks.forEach(task => addTaskToTable(task, tbody));

      dashboard.style.display = 'none';
      projectDetails.style.display = 'block';
    });
  }

  function addTaskToTable(task, tbody) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${task.title}</td>
      <td><span class="status ${task.status.replace(' ', '').toLowerCase()}">${task.status}</span></td>
      <td>${task.assignee}</td>
      <td>
        ${task.status !== 'Done' ? '<button class="done-btn">Done</button>' : ''}
        <button class="edit-btn">Edit</button>
      </td>
    `;
    tbody.appendChild(tr);

    const doneBtn = tr.querySelector('.done-btn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        task.status = 'Done';
        saveProjects();
        const statusSpan = tr.querySelector('.status');
        statusSpan.textContent = 'Done';
        statusSpan.className = 'status done';
        doneBtn.remove();

        const card = document.querySelector(`.project-card[data-id="${currentProjectId}"]`);
        if (card) updateProgress(card, projects.find(p => p.id === currentProjectId));
      });
    }
  }

  function attachDeleteBtn(card) {
    const del = card.querySelector('.delete-btn');
    del.addEventListener('click', () => {
      const id = card.dataset.id;
      projects = projects.filter(p => p.id !== id);
      saveProjects();
      card.remove();

      if (currentProjectId === id) {
        projectDetails.style.display = 'none';
        dashboard.style.display = 'block';
        currentProjectId = null;
      }
    });
  }

  projects.forEach(project => createProjectCard(project));

  createCard.addEventListener('click', () => createModal.style.display = 'flex');
  closeButtons.forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none'));
  window.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });

  document.getElementById('createProjectForm').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('projectTitle').value.trim();
    const desc = document.getElementById('projectDesc').value.trim();
    const due = document.getElementById('projectDue').value;
    if (!title || !desc || !due) return;

    const id = Date.now().toString();
    const project = { id, title, desc, due, tasks: [] };
    projects.push(project);
    saveProjects();
    createProjectCard(project);

    createModal.style.display = 'none';
    e.target.reset();
  });

  backBtn.addEventListener('click', () => {
    projectDetails.style.display = 'none';
    dashboard.style.display = 'block';
    currentProjectId = null;
  });

  addTaskBtn.addEventListener('click', () => {
    if (!currentProjectId) return;
    addTaskModal.style.display = 'flex';
  });

  document.getElementById('addTaskForm').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const status = document.getElementById('taskStatus').value;
    const assignee = document.getElementById('taskAssignee').value.trim();
    if (!title || !assignee) return;

    const task = { title, status, assignee };
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;

    project.tasks.push(task);
    saveProjects();
    addTaskToTable(task, projectDetails.querySelector('tbody'));

    const card = document.querySelector(`.project-card[data-id="${currentProjectId}"]`);
    if (card) updateProgress(card, project);

    addTaskModal.style.display = 'none';
    e.target.reset();
  });
});