<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QR Apps</title>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="css/style.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>


</head>

<body>
<!--- Splashscreen--->
<?php include 'reusable/splashscreen.php';?>
<!--- Header--->
<?php include 'reusable/header.php';?>


<div class="container">
  <div class="menu" id="modules"></div>
  <div class="tools">
    <h4>Quick Tools</h4>
    <div class="tools-grid" id="tools"></div>
  </div>
</div>

<footer id="appFooter">© 2026 Farm System</footer>

<div class="modal" id="modal">
  <div class="modal-content">
    <span class="close" onclick="closeModal()">&times;</span>
    <form id="moduleForm" style="display:flex;flex-direction:column;gap:10px;">
      <label>Icon</label>
      <select id="icon"></select>
      <label>Label</label>
      <input id="label" placeholder="Module Name">
      <label>Description</label>
      <textarea id="desc" placeholder="Description"></textarea>
      <label>Link (URL)</label>
      <input id="link" placeholder="https://example.com">
      <button type="button" onclick="save()">Save</button>
    </form>
  </div>
</div>

<script src="js/script.js"></script>

</body>
</html>
